import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:transen_core/transen_core.dart';
import 'package:transen_auth/transen_auth.dart';

class SupportTicketScreen extends ConsumerStatefulWidget {
  const SupportTicketScreen({super.key});

  @override
  ConsumerState<SupportTicketScreen> createState() => _SupportTicketScreenState();
}

class _SupportTicketScreenState extends ConsumerState<SupportTicketScreen> {
  final _inputController = TextEditingController();
  final _refinedController = TextEditingController();
  
  bool _isLoading = false;
  bool _isRefined = false;
  bool _isSending = false;
  
  String _category = 'AUTRE';
  String _urgency = 'MOYEN';

  @override
  void dispose() {
    _inputController.dispose();
    _refinedController.dispose();
    super.dispose();
  }

  Future<void> _refineMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Veuillez saisir votre problème"),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      final geminiService = ref.read(geminiServiceProvider);
      if (!geminiService.isConfigured) {
        throw Exception("La clé API Gemini n'est pas configurée.");
      }

      final result = await geminiService.refineSupportTicket(text);

      setState(() {
        _refinedController.text = result['refinedText'] ?? text;
        _category = result['category'] ?? 'AUTRE';
        _urgency = result['urgency'] ?? 'MOYEN';
        _isRefined = true;
      });
    } catch (e) {
      setState(() {
        _refinedController.text = text;
        _category = 'AUTRE';
        _urgency = 'MOYEN';
        _isRefined = true;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Erreur de reformulation : ${e.toString()}"),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _submitTicket() async {
    final finalMessage = _refinedController.text.trim();
    if (finalMessage.isEmpty) return;

    setState(() => _isSending = true);
    HapticFeedback.mediumImpact();

    try {
      final auth = ref.read(authProvider);
      final userId = auth?.userId ?? 'anonymous';
      final userName = auth?.name ?? 'Utilisateur anonyme';
      final userPhone = auth?.phone ?? '';

      // Enregistre dans la collection Firestore de TranSen
      await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
          .collection('support_tickets')
          .add({
        'userId': userId,
        'userName': userName,
        'userPhone': userPhone,
        'rawMessage': _inputController.text.trim(),
        'message': finalMessage,
        'category': _category,
        'urgency': _urgency,
        'status': 'OPEN',
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => SuccessDialog(
            title: "Ticket envoyé",
            message: "Votre demande de support a été enregistrée avec succès. Notre équipe va l'étudier dans les plus brefs délais.",
            onDismiss: () {
              Navigator.pop(context); // fermer l'écran de support
            },
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Erreur lors de l'envoi : ${e.toString()}"),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      setState(() => _isSending = false);
    }
  }

  Color _getUrgencyColor(String urgency) {
    switch (urgency) {
      case 'HAUT':
        return Colors.redAccent;
      case 'MOYEN':
        return Colors.orange;
      case 'BAS':
      default:
        return Colors.green;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : Colors.grey.shade50,
      appBar: AppBar(
        title: const Text("Support Client IA", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: isDark ? Colors.black87 : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black87,
        elevation: 0.5,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.support_agent, size: 70, color: TranSenColors.primaryGreen),
            const SizedBox(height: 16),
            const Text(
              "Un problème ? Nous sommes là pour vous.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              "Décrivez brièvement votre situation. L'IA de TranSen vous aidera à structurer et à reformuler votre message pour un traitement plus rapide.",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
            const SizedBox(height: 30),
            
            // Étape 1 : Saisie brute du message
            TextField(
              controller: _inputController,
              maxLines: 4,
              enabled: !_isLoading && !_isSending,
              style: TextStyle(color: isDark ? Colors.white : Colors.black87),
              decoration: InputDecoration(
                labelText: "Décrivez votre problème",
                alignLabelWithHint: true,
                hintText: "Ex: j'ai payé par wave 2500f mais j'ai pas eu mon ticket de bus...",
                hintStyle: TextStyle(color: Colors.grey.shade500),
                filled: true,
                fillColor: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(15),
                  borderSide: isDark ? const BorderSide(color: Colors.white10) : BorderSide(color: Colors.grey.shade300),
                ),
              ),
            ),
            const SizedBox(height: 20),
            
            if (_isLoading)
              const Center(child: CircularProgressIndicator(color: TranSenColors.primaryGreen))
            else if (!_isRefined)
              ElevatedButton.icon(
                onPressed: _refineMessage,
                icon: const Icon(Icons.auto_awesome),
                label: const Text("VÉRIFIER ET REFORMULER AVEC L'IA", style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black87,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                ),
              ),
            
            // Étape 2 : Affichage et édition de la reformulation
            if (_isRefined) ...[
              const Divider(height: 40, thickness: 1),
              const Row(
                children: [
                  Icon(Icons.auto_awesome, color: TranSenColors.accentGold, size: 18),
                  SizedBox(width: 8),
                  Text(
                    "Message reformulé par l'IA",
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 15),
              
              // Tags de classification
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: TranSenColors.primaryGreen.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      "Catégorie: $_category",
                      style: const TextStyle(
                        color: TranSenColors.primaryGreen,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getUrgencyColor(_urgency).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      "Urgence: $_urgency",
                      style: TextStyle(
                        color: _getUrgencyColor(_urgency),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 15),
              
              TextField(
                controller: _refinedController,
                maxLines: 4,
                enabled: !_isSending,
                style: TextStyle(color: isDark ? Colors.white : Colors.black87),
                decoration: InputDecoration(
                  labelText: "Message final (modifiable)",
                  alignLabelWithHint: true,
                  filled: true,
                  fillColor: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                ),
              ),
              const SizedBox(height: 25),
              
              if (_isSending)
                const Center(child: CircularProgressIndicator(color: TranSenColors.primaryGreen))
              else
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => setState(() => _isRefined = false),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                        ),
                        child: const Text("RECOMMENCER"),
                      ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _submitTicket,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: TranSenColors.primaryGreen,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                        ),
                        child: const Text("ENVOYER LE TICKET", style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
            ],
          ],
        ),
      ),
    );
  }
}
