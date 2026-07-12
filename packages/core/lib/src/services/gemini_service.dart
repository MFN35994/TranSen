import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

class GeminiService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'https://api.transen.org',
    connectTimeout: const Duration(seconds: 60),
    receiveTimeout: const Duration(seconds: 60),
  ));

  // L'IA est toujours configurée via le backend sécurisé
  bool get isConfigured => true;

  /// Assistant de Voyage Virtuel (Chatbot)
  /// Envoie l'historique de discussion et retourne la réponse de l'assistant
  Future<String> sendMessage(List<Map<String, dynamic>> messages) async {
    try {
      // Formater l'historique pour le serveur
      final List<Map<String, dynamic>> history = messages.map((m) {
        return {
          'text': m['text'] as String,
          'isUser': m['isUser'] as bool,
        };
      }).toList();

      final response = await _dio.post(
        '/api/ai/chat',
        data: {'history': history},
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final candidates = data['candidates'] as List?;
        if (candidates != null && candidates.isNotEmpty) {
          final content = candidates[0]['content'];
          if (content != null) {
            final parts = content['parts'] as List?;
            if (parts != null && parts.isNotEmpty) {
              return parts[0]['text']?.toString() ?? "Désolé, je n'ai pas pu générer de réponse.";
            }
          }
        }
      }
      return "Désolé, je n'ai pas pu obtenir de réponse de l'assistant de voyage.";
    } catch (e) {
      debugPrint("Error communication chat backend: $e");
      return "Oups ! Une erreur de connexion est survenue. Veuillez vérifier votre réseau.";
    }
  }

  /// Extraction de document Chauffeur (OCR Intelligent)
  /// Analyse l'image du document et retourne les informations structurées
  Future<Map<String, dynamic>> scanDriverLicense(Uint8List imageBytes, String mimeType) async {
    try {
      final base64Image = base64Encode(imageBytes);

      final response = await _dio.post(
        '/api/ai/scan-license',
        data: {
          'image': base64Image,
          'mimeType': mimeType,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final candidates = data['candidates'] as List?;
        if (candidates != null && candidates.isNotEmpty) {
          final text = candidates[0]['content']['parts'][0]['text'] as String?;
          if (text != null) {
            String cleanedText = text.trim();
            if (cleanedText.startsWith('```')) {
              cleanedText = cleanedText.replaceFirst(RegExp(r'^```json\s*'), '');
              cleanedText = cleanedText.replaceFirst(RegExp(r'\s*```$'), '');
            }
            return jsonDecode(cleanedText.trim()) as Map<String, dynamic>;
          }
        }
      }
    } catch (e) {
      debugPrint("Error scanning driver license via backend: $e");
    }

    return {
      'firstName': '',
      'lastName': '',
      'documentNumber': '',
      'expiryDate': null,
    };
  }

  /// Assistant Support Client
  /// Reformule, catégorise et structure une réclamation en ticket propre
  Future<Map<String, dynamic>> refineSupportTicket(String rawInput) async {
    try {
      final response = await _dio.post(
        '/api/ai/refine-ticket',
        data: {'text': rawInput},
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final candidates = data['candidates'] as List?;
        if (candidates != null && candidates.isNotEmpty) {
          final text = candidates[0]['content']['parts'][0]['text'] as String?;
          if (text != null) {
            String cleanedText = text.trim();
            if (cleanedText.startsWith('```')) {
              cleanedText = cleanedText.replaceFirst(RegExp(r'^```json\s*'), '');
              cleanedText = cleanedText.replaceFirst(RegExp(r'\s*```$'), '');
            }
            return jsonDecode(cleanedText.trim()) as Map<String, dynamic>;
          }
        }
      }
    } catch (e) {
      debugPrint("Error refining support ticket via backend: $e");
    }

    return {
      'refinedText': rawInput,
      'category': 'AUTRE',
      'urgency': 'MOYEN',
    };
  }
}

final geminiServiceProvider = Provider<GeminiService>((ref) {
  return GeminiService();
});
