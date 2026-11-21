import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio dio;

  /// Client HTTP mutualisé avec timeouts pour les API tierces (Mapbox, OpenStreetMap)
  /// sans fuite de JWT TranSen vers des serveurs externes.
  static final Dio externalDio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 12),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TranSenApp/2.0 (https://app.transen.org)',
      },
    ),
  );

  // L'URL de production sur le domaine personnalisé
  final String baseUrl = 'https://api.transen.org';

  // Protection Anti-Double-Click & Déduplication des requêtes en vol (Mutations POST/PUT/DELETE)
  final Set<String> _inFlightMutations = <String>{};
  final Map<String, int> _recentMutationTimestamps = <String, int>{};
  static const int _doubleClickCooldownMs = 1500;

  String _computeMutationKey(RequestOptions options) {
    String bodyStr = '';
    final data = options.data;
    if (data != null) {
      if (data is FormData) {
        final fieldNames = data.fields.map((e) => '${e.key}=${e.value}').join('&');
        final fileNames = data.files.map((e) => '${e.key}:${e.value.filename}').join(',');
        bodyStr = 'FormData:$fieldNames|$fileNames';
      } else {
        try {
          bodyStr = jsonEncode(data);
        } catch (_) {
          bodyStr = data.toString();
        }
      }
    }
    final queryStr = options.queryParameters.isNotEmpty ? options.queryParameters.toString() : '';
    return '${options.method}:${options.path}:$queryStr:${bodyStr.hashCode}';
  }

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Transen-Platform': kIsWeb ? 'app.transen.org' : 'mobile_app',
        },
      ),
    );

    // Intercepteur JWT + Protection Anti-Double-Click & Clé d'Idempotence
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final method = options.method.toUpperCase();
          final isMutation = method == 'POST' || method == 'PUT' || method == 'DELETE' || method == 'PATCH';

          if (isMutation &&
              !options.path.contains('/api/ai/') &&
              !options.path.contains('/api/system/telemetry')) {
            final mutationKey = _computeMutationKey(options);
            final now = DateTime.now().millisecondsSinceEpoch;
            final lastSent = _recentMutationTimestamps[mutationKey];

            if (_inFlightMutations.contains(mutationKey) ||
                (lastSent != null && (now - lastSent) < _doubleClickCooldownMs)) {
              return handler.reject(
                DioException(
                  requestOptions: options,
                  type: DioExceptionType.cancel,
                  error: 'Requête déjà en cours de traitement (Anti-Double-Click actif).',
                ),
              );
            }

            _inFlightMutations.add(mutationKey);
            _recentMutationTimestamps[mutationKey] = now;
            options.extra['mutationKey'] = mutationKey;
            options.headers['X-Idempotency-Key'] = '$now-${mutationKey.hashCode.abs()}';
          }

          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('jwt_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          final mutationKey = response.requestOptions.extra['mutationKey'] as String?;
          if (mutationKey != null) {
            _inFlightMutations.remove(mutationKey);
          }
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          final mutationKey = e.requestOptions.extra['mutationKey'] as String?;
          if (mutationKey != null) {
            _inFlightMutations.remove(mutationKey);
          }
          return handler.next(e);
        },
      ),
    );
  }

  /// Envoie une télémétrie non-bloquante au centre de commandement TranSen et renvoie
  /// la bannière d'urgence globale si active.
  Future<Map<String, dynamic>?> sendTelemetry(
    String featureKey, {
    int latencyMs = 24,
    bool isError = false,
    String? logMessage,
  }) async {
    try {
      final response = await dio.post(
        '/api/system/telemetry',
        data: {
          'featureKey': featureKey,
          'platform': kIsWeb ? 'app.transen.org (Web App)' : 'Mobile App (Android / iOS)',
          'latencyMs': latencyMs,
          'isError': isError,
          if (logMessage != null) 'logMessage': logMessage,
        },
      );
      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
        return response.data as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('Telemetry silent warning: $e');
    }
    return null;
  }
}
