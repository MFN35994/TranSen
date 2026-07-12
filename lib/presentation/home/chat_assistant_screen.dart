import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen_core/transen_core.dart';

class ChatAssistantScreen extends ConsumerStatefulWidget {
  const ChatAssistantScreen({super.key});

  @override
  ConsumerState<ChatAssistantScreen> createState() => _ChatAssistantScreenState();
}

class _ChatAssistantScreenState extends ConsumerState<ChatAssistantScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  
  final List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;
  bool _isInitError = false;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  void _initializeChat() {
    try {
      // Message de bienvenue initial
      _messages.add({
        'text': "Bonjour ! Je suis votre assistant virtuel TranSen. Comment puis-je vous aider dans vos déplacements ou envois de colis au Sénégal aujourd'hui ? 🇸🇳",
        'isUser': false,
      });
    } catch (e) {
      setState(() {
        _isInitError = true;
      });
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty || _isLoading) return;

    setState(() {
      _messages.add({
        'text': text.trim(),
        'isUser': true,
      });
      _isLoading = true;
    });
    
    _messageController.clear();
    _scrollToBottom();
    HapticFeedback.lightImpact();

    try {
      final geminiService = ref.read(geminiServiceProvider);
      final responseText = await geminiService.sendMessage(_messages);
      
      setState(() {
        _messages.add({
          'text': responseText.trim(),
          'isUser': false,
        });
      });
    } catch (e) {
      setState(() {
        _messages.add({
          'text': "Oups ! Une erreur est survenue lors de la communication avec l'assistant. Veuillez vérifier votre connexion.",
          'isUser': false,
          'isError': true,
        });
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : Colors.grey.shade50,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: TranSenColors.primaryGreen.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.psychology, color: TranSenColors.primaryGreen, size: 22),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Assistant TranSen", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text("En ligne • IA Gemini", style: TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ],
        ),
        backgroundColor: isDark ? Colors.black87 : Colors.white,
        elevation: 0.5,
        foregroundColor: isDark ? Colors.white : Colors.black87,
      ),
      body: _isInitError
          ? _buildConfigError()
          : Column(
              children: [
                Expanded(
                  child: _messages.length <= 1 
                      ? _buildWelcomeSuggestions(isDark)
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                          itemCount: _messages.length,
                          itemBuilder: (context, index) {
                            final msg = _messages[index];
                            return _buildMessageBubble(msg, isDark);
                          },
                        ),
                ),
                if (_isLoading) _buildTypingIndicator(isDark),
                _buildInputBar(isDark),
              ],
            ),
    );
  }

  Widget _buildConfigError() {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.warning_amber_rounded, size: 64, color: Colors.amber),
            const SizedBox(height: 16),
            const Text(
              "Configuration requise",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              "La clé API Gemini n'a pas été configurée pour le client mobile. Veuillez recompiler l'application en incluant votre clé API.",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black12,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                "flutter run --dart-define=GEMINI_API_KEY=votre_cle",
                style: TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeSuggestions(bool isDark) {
    final suggestions = [
      "💡 Tarifs Allô Dakar ?",
      "💡 Comment envoyer un colis avec Yobanté ?",
      "💡 Quels sont les trajets interurbains ?",
      "💡 Comment s'inscrire comme chauffeur ?",
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 40),
          Center(
            child: Icon(
              Icons.chat_bubble_outline_rounded,
              size: 70,
              color: TranSenColors.primaryGreen.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            "Posez-moi vos questions !",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            "Je peux vous renseigner sur les trajets, les prix estimés, l'envoi de colis ou le fonctionnement de la plateforme.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey, fontSize: 13),
          ),
          const SizedBox(height: 40),
          ...suggestions.map((sug) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  onTap: () => _sendMessage(sug.replaceAll("💡 ", "")),
                  borderRadius: BorderRadius.circular(15),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.white,
                      border: Border.all(
                        color: isDark ? Colors.white12 : Colors.grey.shade200,
                      ),
                      borderRadius: BorderRadius.circular(15),
                      boxShadow: [
                        if (!isDark)
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                      ],
                    ),
                    child: Text(
                      sug,
                      style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                    ),
                  ),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> msg, bool isDark) {
    final isUser = msg['isUser'] as bool;
    final isError = msg['isError'] == true;
    final text = msg['text'] as String;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isUser
              ? TranSenColors.primaryGreen
              : (isError
                  ? Colors.redAccent.withValues(alpha: 0.1)
                  : (isDark ? const Color(0xFF2C2C2C) : Colors.white)),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isUser ? const Radius.circular(16) : Radius.zero,
            bottomRight: isUser ? Radius.zero : const Radius.circular(16),
          ),
          border: isUser
              ? null
              : Border.all(
                  color: isError ? Colors.redAccent.withValues(alpha: 0.3) : (isDark ? Colors.white10 : Colors.grey.shade200),
                ),
          boxShadow: [
            if (!isUser && !isDark)
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 5,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Text(
          text,
          style: TextStyle(
            color: isUser
                ? Colors.white
                : (isError ? Colors.redAccent : (isDark ? Colors.white : Colors.black87)),
            fontSize: 14,
            height: 1.4,
          ),
        ),
      ),
    );
  }

  Widget _buildTypingIndicator(bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, bottom: 20),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF2C2C2C) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text("L'assistant réfléchit", style: TextStyle(fontSize: 12, color: Colors.grey)),
              SizedBox(width: 8),
              SizedBox(
                width: 10,
                height: 10,
                child: CircularProgressIndicator(strokeWidth: 2, color: TranSenColors.primaryGreen),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputBar(bool isDark) {
    return Container(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 24, top: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.black : Colors.white,
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              onSubmitted: _sendMessage,
              style: TextStyle(color: isDark ? Colors.white : Colors.black87),
              decoration: InputDecoration(
                hintText: "Écrivez votre question...",
                hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 14),
                filled: true,
                fillColor: isDark ? const Color(0xFF1E1E1E) : Colors.grey.shade100,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: () => _sendMessage(_messageController.text),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                color: TranSenColors.primaryGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.send, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}
