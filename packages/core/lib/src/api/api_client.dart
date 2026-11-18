

import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio dio;

  // L'URL de production sur le domaine personnalisé
  final String baseUrl = 'https://api.transen.org';

  // Protection Anti-Double-Click & Déduplication des requêtes en vol (Mutations POST/PUT/DELETE)
  final Set<String> _inFlightMutations = <String>{};
  final Map<String, int> _recentMutationTimestamps = <String, int>{};
  static const int _doubleClickCooldownMs = 1500;

  String _computeMutationKey(RequestOptions options) {
    final bodyStr = options.data != null ? jsonEncode(options.data) : '';
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
        },
      ),
    );

    // Intercepteur JWT + Protection Anti-Double-Click & Clé d'Idempotence
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final method = options.method.toUpperCase();
          final isMutation = method == 'POST' || method == 'PUT' || method == 'DELETE' || method == 'PATCH';

          if (isMutation && !options.path.contains('/api/ai/')) {
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
          if (token != null) {
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
}
