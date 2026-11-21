import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:transen_core/transen_core.dart';

/// Lecteur juridique officiel **TranSen Aurora** (CGU, Politique de Confidentialité)
/// Adaptatif Sombre Émeraude-Obsidienne / Clair Cristallin avec rendu Markdown riche.
class LegalScreen extends StatefulWidget {
  final String title;
  final String assetPath;

  const LegalScreen({
    super.key,
    required this.title,
    required this.assetPath,
  });

  @override
  State<LegalScreen> createState() => _LegalScreenState();
}

class _LegalScreenState extends State<LegalScreen> {
  String _content = '';
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadContent();
  }

  Future<void> _loadContent() async {
    try {
      final text = await rootBundle.loadString(widget.assetPath);
      if (mounted) {
        setState(() {
          _content = text;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = "Impossible de charger ce document juridique.";
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isPrivacy = widget.assetPath.contains('confidentialite');

    return Scaffold(
      backgroundColor: TranSenColors.scaffoldBg(isDark),
      appBar: AppBar(
        backgroundColor: isDark ? TranSenColors.deepSurface : TranSenColors.darkGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          widget.title,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 19),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: PremiumBackground(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: TranSenColors.auroraEmeraldLight),
              )
            : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: AuroraGlassCard(
                        accentColor: TranSenColors.auroraRose,
                        child: Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: TranSenColors.primaryText(isDark)),
                        ),
                      ),
                    ),
                  )
                : _buildContent(isDark, isPrivacy),
      ),
    );
  }

  Widget _buildContent(bool isDark, bool isPrivacy) {
    final lines = _content.split('\n');
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 36),
      children: [
        // En-tête officiel TranSen Aurora
        AuroraGlassCard(
          accentColor: isPrivacy ? TranSenColors.auroraCyan : TranSenColors.auroraEmeraldLight,
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: (isPrivacy ? TranSenColors.auroraCyan : TranSenColors.auroraEmerald)
                      .withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: (isPrivacy ? TranSenColors.auroraCyan : TranSenColors.auroraEmeraldLight)
                        .withValues(alpha: 0.4),
                  ),
                ),
                child: Icon(
                  isPrivacy ? Icons.privacy_tip_rounded : Icons.gavel_rounded,
                  color: isPrivacy ? TranSenColors.auroraCyan : TranSenColors.auroraEmeraldLight,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AuroraStatusPill(
                      label: isPrivacy ? 'CONFORMITÉ CDP SÉNÉGAL' : 'DOCUMENT OFFICIEL TRANSEN',
                      color: isPrivacy ? TranSenColors.auroraCyan : TranSenColors.auroraGoldBright,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.title,
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: TranSenColors.primaryText(isDark),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Corps du document dans une carte verre Aurora lisible
        AuroraGlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: lines.map((raw) {
              final line = raw.trim();
              if (line.isEmpty) return const SizedBox(height: 8);

              if (line.startsWith('# ')) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 14, top: 4),
                  child: Text(
                    line.substring(2),
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: isDark ? TranSenColors.auroraEmeraldLight : TranSenColors.darkGreen,
                      height: 1.25,
                    ),
                  ),
                );
              }

              if (line.startsWith('## ')) {
                return Padding(
                  padding: const EdgeInsets.only(top: 18, bottom: 8),
                  child: Row(
                    children: [
                      Container(
                        width: 4,
                        height: 18,
                        decoration: BoxDecoration(
                          color: TranSenColors.auroraGold,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          line.substring(3),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: isDark ? TranSenColors.auroraGoldBright : TranSenColors.darkGreen,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }

              if (line.startsWith('### ')) {
                return Padding(
                  padding: const EdgeInsets.only(top: 10, bottom: 4),
                  child: Text(
                    line.substring(4),
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                      color: TranSenColors.primaryText(isDark),
                    ),
                  ),
                );
              }

              if (line.startsWith('- ')) {
                return Padding(
                  padding: const EdgeInsets.only(left: 6, bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(top: 7),
                        child: Icon(Icons.circle, size: 6, color: TranSenColors.auroraEmeraldLight),
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: _buildFormattedText(line.substring(2), isDark)),
                    ],
                  ),
                );
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: _buildFormattedText(line, isDark),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 18),
        Center(
          child: Text(
            'TranSen · Dakar, Sénégal · contact@transen.org',
            style: TextStyle(
              fontSize: 11.5,
              color: TranSenColors.secondaryText(isDark).withValues(alpha: 0.7),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFormattedText(String text, bool isDark) {
    final baseStyle = TextStyle(
      fontSize: 13.8,
      color: TranSenColors.secondaryText(isDark),
      height: 1.6,
    );
    final boldStyle = baseStyle.copyWith(
      fontWeight: FontWeight.w800,
      color: TranSenColors.primaryText(isDark),
    );

    final spans = <TextSpan>[];
    final regex = RegExp(r'\*\*(.+?)\*\*');
    int lastEnd = 0;

    for (final match in regex.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(text: text.substring(lastEnd, match.start), style: baseStyle));
      }
      spans.add(TextSpan(text: match.group(1), style: boldStyle));
      lastEnd = match.end;
    }
    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd), style: baseStyle));
    }

    return RichText(text: TextSpan(children: spans));
  }
}
