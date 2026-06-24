import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_core/transen_core.dart';
import 'package:transen_profile/transen_profile.dart';
import 'package:transen/presentation/widgets/profile_drawer.dart';

/// Dynamic announcement model supporting both local fallbacks and Firestore documents
class HubAnnouncement {
  final String id;
  final String title;
  final String description;
  final String? speakText;
  final String? audioUrl; // Streaming MP3 URL from Firebase Storage
  final IconData icon;
  final List<Color> gradientColors;
  final Color accentColor;
  final String buttonLabel;
  final VoidCallback onTap;

  HubAnnouncement({
    required this.id,
    required this.title,
    required this.description,
    this.speakText,
    this.audioUrl,
    required this.icon,
    required this.gradientColors,
    required this.accentColor,
    required this.buttonLabel,
    required this.onTap,
  });
}

class SmartMediaHubCard extends ConsumerStatefulWidget {
  final VoidCallback? onNavigateToBus;
  const SmartMediaHubCard({super.key, this.onNavigateToBus});

  @override
  ConsumerState<SmartMediaHubCard> createState() => _SmartMediaHubCardState();
}

class _SmartMediaHubCardState extends ConsumerState<SmartMediaHubCard> with TickerProviderStateMixin {
  late PageController _pageController;
  late FlutterTts _flutterTts;
  late AudioPlayer _audioPlayer;
  StreamSubscription? _audioPlayerStateSubscription;
  StreamSubscription? _audioPlayerCompleteSubscription;
  
  Timer? _carouselTimer;
  Timer? _soundwaveTimer;
  Timer? _typewriterTimer;

  int _currentPageIndex = 0;
  bool _isSpeaking = false;      // True if TTS is reading
  bool _isPlayingAudio = false;  // True if MP3 is streaming

  // Slogan rotation state
  int _currentSloganIndex = 0;
  final List<String> _slogans = [
    "Où allons-nous aujourd'hui ?",
    "Voyagez en toute sécurité et confort.",
    "Faites-vous livrer vos colis en un clin d'œil.",
    "Le transport sénégalais réinventé pour vous.",
  ];
  String _displayedSlogan = "";
  int _charIndex = 0;
  bool _isDeleting = false;

  // Soundwave animation heights
  final List<double> _soundwaveHeights = [6.0, 6.0, 6.0, 6.0, 6.0];
  final math.Random _random = math.Random();

  List<HubAnnouncement> _activeAnnouncements = [];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 0);
    _initTts();
    _initAudioPlayer();
    _startTypewriter();
  }

  void _initTts() {
    _flutterTts = FlutterTts();
    _flutterTts.setLanguage("fr-FR");
    _flutterTts.setPitch(1.0);
    _flutterTts.setSpeechRate(0.5);

    _flutterTts.setStartHandler(() {
      if (mounted) {
        setState(() {
          _isSpeaking = true;
        });
        _startSoundwaveAnimation();
      }
    });

    _flutterTts.setCompletionHandler(() {
      if (mounted) {
        setState(() {
          _isSpeaking = false;
        });
        _stopSoundwaveAnimation();
      }
    });

    _flutterTts.setErrorHandler((msg) {
      debugPrint("TTS Error: $msg");
      if (mounted) {
        setState(() {
          _isSpeaking = false;
        });
        _stopSoundwaveAnimation();
      }
    });

    _flutterTts.setCancelHandler(() {
      if (mounted) {
        setState(() {
          _isSpeaking = false;
        });
        _stopSoundwaveAnimation();
      }
    });
  }

  void _initAudioPlayer() {
    _audioPlayer = AudioPlayer();
    
    _audioPlayerStateSubscription = _audioPlayer.onPlayerStateChanged.listen((state) {
      if (!mounted) return;
      setState(() {
        _isPlayingAudio = state == PlayerState.playing;
      });
      if (_isPlayingAudio) {
        _startSoundwaveAnimation();
      } else {
        _stopSoundwaveAnimation();
      }
    });

    _audioPlayerCompleteSubscription = _audioPlayer.onPlayerComplete.listen((event) {
      if (!mounted) return;
      setState(() {
        _isPlayingAudio = false;
      });
      _stopSoundwaveAnimation();
    });
  }

  void _startTypewriter() {
    _displayedSlogan = "";
    _charIndex = 0;
    _isDeleting = false;
    _typewriterTimer?.cancel();
    
    _typewriterTimer = Timer.periodic(const Duration(milliseconds: 70), (timer) {
      if (!mounted) return;
      
      final currentFullSlogan = _slogans[_currentSloganIndex];
      
      setState(() {
        if (!_isDeleting) {
          if (_charIndex < currentFullSlogan.length) {
            _displayedSlogan += currentFullSlogan[_charIndex];
            _charIndex++;
          } else {
            _isDeleting = true;
            _typewriterTimer?.cancel();
            Future.delayed(const Duration(seconds: 3), () {
              if (mounted) _resumeTypewriter();
            });
          }
        } else {
          if (_displayedSlogan.isNotEmpty) {
            _displayedSlogan = _displayedSlogan.substring(0, _displayedSlogan.length - 1);
          } else {
            _isDeleting = false;
            _currentSloganIndex = (_currentSloganIndex + 1) % _slogans.length;
            _charIndex = 0;
          }
        }
      });
    });
  }

  void _resumeTypewriter() {
    if (!mounted) return;
    _typewriterTimer = Timer.periodic(const Duration(milliseconds: 45), (timer) {
      if (!mounted) return;
      setState(() {
        if (_displayedSlogan.isNotEmpty) {
          _displayedSlogan = _displayedSlogan.substring(0, _displayedSlogan.length - 1);
        } else {
          _isDeleting = false;
          _currentSloganIndex = (_currentSloganIndex + 1) % _slogans.length;
          _charIndex = 0;
          _typewriterTimer?.cancel();
          _startTypewriter();
        }
      });
    });
  }

  void _startCarouselAutoPlay() {
    _carouselTimer?.cancel();
    if (_activeAnnouncements.isEmpty) return;
    
    _carouselTimer = Timer.periodic(const Duration(seconds: 8), (timer) {
      if (!mounted) return;
      if (_isSpeaking || _isPlayingAudio) return; // Don't slide while audio is playing
      
      final nextIndex = (_currentPageIndex + 1) % _activeAnnouncements.length;
      _pageController.animateToPage(
        nextIndex,
        duration: const Duration(milliseconds: 800),
        curve: Curves.fastOutSlowIn,
      );
    });
  }

  void _startSoundwaveAnimation() {
    _soundwaveTimer?.cancel();
    _soundwaveTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (!mounted) return;
      setState(() {
        for (int i = 0; i < _soundwaveHeights.length; i++) {
          _soundwaveHeights[i] = 4.0 + _random.nextDouble() * 20.0;
        }
      });
    });
  }

  void _stopSoundwaveAnimation() {
    _soundwaveTimer?.cancel();
    setState(() {
      for (int i = 0; i < _soundwaveHeights.length; i++) {
        _soundwaveHeights[i] = 6.0;
      }
    });
  }

  /// Toggles either MP3 streaming or Text-to-Speech depending on data availability
  Future<void> _toggleAudio() async {
    await HapticFeedback.mediumImpact();
    if (_activeAnnouncements.isEmpty) return;

    final currentAnnouncement = _activeAnnouncements[_currentPageIndex];

    // Case 1: Custom MP3 is playing -> Stop it
    if (_isPlayingAudio) {
      await _audioPlayer.stop();
      return;
    }

    // Case 2: TTS is speaking -> Stop it
    if (_isSpeaking) {
      await _flutterTts.stop();
      return;
    }

    // Start playing
    final mp3Url = currentAnnouncement.audioUrl;
    final ttsText = currentAnnouncement.speakText;

    if (mp3Url != null && mp3Url.isNotEmpty) {
      // Play high-fidelity custom MP3 from Firestore/Firebase Storage
      try {
        await _audioPlayer.play(UrlSource(mp3Url));
      } catch (e) {
        debugPrint("Error playing MP3 URL: $e");
        // Fallback to TTS if MP3 fails
        if (ttsText != null && ttsText.isNotEmpty) {
          await _flutterTts.speak(ttsText);
        }
      }
    } else if (ttsText != null && ttsText.isNotEmpty) {
      // Fallback to native French speech synthesis
      await _flutterTts.speak(ttsText);
    }
  }

  Future<void> _stopAllAudio() async {
    if (_isSpeaking) {
      await _flutterTts.stop();
    }
    if (_isPlayingAudio) {
      await _audioPlayer.stop();
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _flutterTts.stop();
    _audioPlayer.stop();
    _audioPlayer.dispose();
    _audioPlayerStateSubscription?.cancel();
    _audioPlayerCompleteSubscription?.cancel();
    _carouselTimer?.cancel();
    _soundwaveTimer?.cancel();
    _typewriterTimer?.cancel();
    super.dispose();
  }

  /// Helper to convert Hexadecimal color string (e.g. #F39C12 or FF5733) into a Flutter Color
  Color _parseHexColor(String? hexStr, Color fallback) {
    if (hexStr == null || hexStr.isEmpty) return fallback;
    try {
      String cleanHex = hexStr.replaceAll('#', '').trim();
      if (cleanHex.length == 6) {
        cleanHex = "FF$cleanHex"; // Add full opacity prefix
      }
      return Color(int.parse(cleanHex, radix: 16));
    } catch (_) {
      return fallback;
    }
  }

  /// Helper to map database icon names to Material Icons
  IconData _mapIcon(String? iconName) {
    if (iconName == null) return Icons.campaign_rounded;
    switch (iconName.toLowerCase().trim()) {
      case 'promo':
      case 'local_offer':
      case 'offer':
        return Icons.local_offer_rounded;
      case 'bus':
      case 'directions_bus':
      case 'transport':
        return Icons.directions_bus_rounded;
      case 'gift':
      case 'card_giftcard':
      case 'reward':
        return Icons.card_giftcard_rounded;
      case 'delivery':
      case 'local_shipping':
      case 'colis':
        return Icons.local_shipping_rounded;
      case 'info':
      case 'info_outline':
        return Icons.info_outline;
      case 'warning':
      case 'alert':
        return Icons.warning_amber_rounded;
      default:
        return Icons.campaign_rounded;
    }
  }

  /// Handles dynamic button clicks coming from the Admin portal configurations
  void _handleAction(String type, String value, BuildContext context) async {
    HapticFeedback.lightImpact();
    switch (type.toLowerCase().trim()) {
      case 'copy_promo':
      case 'copy':
        Clipboard.setData(ClipboardData(text: value));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Code promo '$value' copié avec succès !"),
            backgroundColor: Colors.green,
          ),
        );
        break;
      case 'navigate_bus':
      case 'bus':
        if (widget.onNavigateToBus != null) {
          widget.onNavigateToBus!();
        }
        break;
      case 'navigate_referral':
      case 'referral':
      case 'parrainage':
        Navigator.push(context, MaterialPageRoute(builder: (_) => const ReferralScreen()));
        break;
      case 'open_url':
      case 'link':
      case 'web':
        final uri = Uri.parse(value);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          if (!context.mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Impossible d'ouvrir le lien: $value"), backgroundColor: Colors.red),
          );
        }
        break;
      default:
        debugPrint("Unknown announcement action type: $type");
    }
  }

  /// Pre-configured local announcements shown as safe fallbacks
  List<HubAnnouncement> _getLocalFallbackAnnouncements(BuildContext context) {
    return [
      HubAnnouncement(
        id: 'fallback_promo',
        title: "WEEKEND PROMO VTC 🎟️",
        description: "Bénéficiez de 20% de réduction sur votre trajet ce week-end avec le code TRANSEN20 !",
        speakText: "Weekend promo V T C. Bénéficiez de 20% de réduction sur votre trajet ce week-end avec le code transen 20 !",
        icon: Icons.local_offer_rounded,
        gradientColors: [const Color(0xFFF39C12), const Color(0xFFD35400)],
        accentColor: Colors.amberAccent,
        buttonLabel: "COPIER LE CODE",
        onTap: () {
          Clipboard.setData(const ClipboardData(text: "TRANSEN20"));
          HapticFeedback.lightImpact();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Code TRANSEN20 copié dans le presse-papier !"),
              backgroundColor: Colors.green,
            ),
          );
        },
      ),
      HubAnnouncement(
        id: 'fallback_bus',
        title: "COMPAGNIE PARTENAIRE 🚌",
        description: "Voyagez confortablement de ville en ville avec nos lignes officielles de bus.",
        speakText: "Compagnie partenaire. Voyagez confortablement de ville en ville avec nos lignes officielles de bus partenaires au meilleur prix.",
        icon: Icons.directions_bus_rounded,
        gradientColors: [const Color(0xFF008080), const Color(0xFF1E824C)],
        accentColor: Colors.greenAccent,
        buttonLabel: "DÉCOUVRIR LES LIGNES",
        onTap: () {
          HapticFeedback.lightImpact();
          if (widget.onNavigateToBus != null) {
            widget.onNavigateToBus!();
          }
        },
      ),
      HubAnnouncement(
        id: 'fallback_referral',
        title: "PARRAINEZ & GAGNEZ 🎁",
        description: "Partagez votre code. Gagnez 500 points dès le premier trajet de vos proches !",
        speakText: "Parrainez et gagnez. Partagez votre code de parrainage avec vos proches et gagnez 500 points dès leur premier trajet !",
        icon: Icons.card_giftcard_rounded,
        gradientColors: [const Color(0xFF8E44AD), const Color(0xFF2C3E50)],
        accentColor: Colors.purpleAccent,
        buttonLabel: "PARRAINER MAINTENANT",
        onTap: () {
          HapticFeedback.lightImpact();
          Navigator.push(context, MaterialPageRoute(builder: (_) => const ReferralScreen()));
        },
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Get user's first name reactively
    final auth = ref.watch(authProvider);
    final userId = auth?.userId ?? '';
    final userAsync = userId.isNotEmpty 
        ? ref.watch(userFutureProvider(userId)) 
        : const AsyncValue<Map<String, dynamic>?>.data(null);
    
    final userData = userAsync.value;
    final String fullName = userData?['name'] ?? auth?.name ?? '';
    final String firstName = fullName.split(' ').first;
    final String greetingName = firstName.isNotEmpty ? firstName : 'Client';

    // Stream announcements in real-time from Firestore database 'transen'
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
          .collection('announcements')
          .snapshots(),
      builder: (context, snapshot) {
        // Parse announcements
        if (snapshot.hasData && snapshot.data!.docs.isNotEmpty) {
          _activeAnnouncements = snapshot.data!.docs.map((doc) {
            final data = doc.data() as Map<String, dynamic>;
            
            // Parse colors
            final colorsList = data['gradientColors'] as List?;
            List<Color> gradients = [const Color(0xFF2C3E50), const Color(0xFF3498DB)]; // default
            if (colorsList != null && colorsList.length >= 2) {
              gradients = [
                _parseHexColor(colorsList[0].toString(), gradients[0]),
                _parseHexColor(colorsList[1].toString(), gradients[1]),
              ];
            } else if (colorsList != null && colorsList.isNotEmpty) {
              gradients = [
                _parseHexColor(colorsList[0].toString(), gradients[0]),
                _parseHexColor(colorsList[0].toString(), gradients[0]),
              ];
            }

            final accentColorStr = data['accentColor'] as String?;
            final accentColor = _parseHexColor(accentColorStr, Colors.white);

            return HubAnnouncement(
              id: doc.id,
              title: (data['title'] ?? 'NEWS TRANSEN').toString().toUpperCase(),
              description: data['description'] ?? '',
              speakText: data['speakText'],
              audioUrl: data['audioUrl'],
              icon: _mapIcon(data['icon'] as String?),
              gradientColors: gradients,
              accentColor: accentColor,
              buttonLabel: (data['buttonLabel'] ?? 'EN SAVOIR PLUS').toString().toUpperCase(),
              onTap: () {
                final actionType = data['actionType'] ?? '';
                final actionValue = data['actionValue'] ?? '';
                _handleAction(actionType, actionValue, context);
              },
            );
          }).toList();
        } else {
          // Fallback if no database announcements exist
          _activeAnnouncements = _getLocalFallbackAnnouncements(context);
        }

        // Keep page index within bounds
        if (_currentPageIndex >= _activeAnnouncements.length) {
          _currentPageIndex = math.max(0, _activeAnnouncements.length - 1);
        }

        // Restart carousel autoplay
        _startCarouselAutoPlay();

        final bool hasAudio = _activeAnnouncements.isNotEmpty &&
            ((_activeAnnouncements[_currentPageIndex].audioUrl != null && _activeAnnouncements[_currentPageIndex].audioUrl!.isNotEmpty) ||
             (_activeAnnouncements[_currentPageIndex].speakText != null && _activeAnnouncements[_currentPageIndex].speakText!.isNotEmpty));

        final bool isCurrentlyPlaying = _isSpeaking || _isPlayingAudio;

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0x2B000000) : const Color(0x0E000000),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
              width: 1.5,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. TOP ROW: WELCOME & AUDIO BUTTON
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Bonjour $greetingName 👋",
                              style: GoogleFonts.outfit(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white70 : Colors.black54,
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: 3),
                            SizedBox(
                              height: 34,
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Text(
                                      _displayedSlogan,
                                      style: GoogleFonts.outfit(
                                        fontSize: 23,
                                        fontWeight: FontWeight.w900,
                                        color: isDark ? Colors.white : Colors.black87,
                                        height: 1.1,
                                        letterSpacing: -0.6,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.fade,
                                    ),
                                  ),
                                  Container(
                                    width: 2.5,
                                    height: 20,
                                    color: isDark 
                                        ? Colors.white.withValues(alpha: 0.8) 
                                        : Colors.black.withValues(alpha: 0.8),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      // Audio narrator (TTS or MP3 streaming)
                      if (hasAudio)
                        GestureDetector(
                          onTap: _toggleAudio,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: isCurrentlyPlaying
                                  ? TranSenColors.primaryGreen
                                  : (isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05)),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (isCurrentlyPlaying) ...[
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: List.generate(_soundwaveHeights.length, (index) {
                                      return AnimatedContainer(
                                        duration: const Duration(milliseconds: 100),
                                        margin: const EdgeInsets.symmetric(horizontal: 1.5),
                                        width: 2.5,
                                        height: _soundwaveHeights[index],
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                      );
                                    }),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.stop_rounded, color: Colors.white, size: 16),
                                ] else ...[
                                  Icon(
                                    Icons.volume_up_rounded,
                                    color: isDark ? Colors.white : Colors.black87,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    "ÉCOUTER",
                                    style: GoogleFonts.outfit(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? Colors.white : Colors.black87,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ]
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // 2. CAROUSEL OF ANNOUNCEMENTS
                  if (_activeAnnouncements.isNotEmpty)
                    SizedBox(
                      height: 145,
                      child: PageView.builder(
                        controller: _pageController,
                        onPageChanged: (index) {
                          setState(() {
                            _currentPageIndex = index;
                          });
                          _stopAllAudio(); // Stop playing when switching slides
                        },
                        itemCount: _activeAnnouncements.length,
                        itemBuilder: (context, index) {
                          final item = _activeAnnouncements[index];
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: item.gradientColors,
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(22),
                              boxShadow: [
                                BoxShadow(
                                  color: item.gradientColors.first.withValues(alpha: 0.3),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                )
                              ],
                            ),
                            child: Stack(
                              children: [
                                Positioned(
                                  right: -20,
                                  bottom: -20,
                                  child: Opacity(
                                    opacity: 0.12,
                                    child: Icon(
                                      item.icon,
                                      size: 140,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(18),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(
                                            item.icon,
                                            color: item.accentColor,
                                            size: 18,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              item.title,
                                              style: GoogleFonts.outfit(
                                                color: Colors.white,
                                                fontSize: 12,
                                                fontWeight: FontWeight.w900,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Expanded(
                                        child: Text(
                                          item.description,
                                          style: GoogleFonts.outfit(
                                            color: Colors.white.withValues(alpha: 0.9),
                                            fontSize: 14,
                                            fontWeight: FontWeight.w500,
                                            height: 1.25,
                                            letterSpacing: -0.1,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Align(
                                        alignment: Alignment.bottomLeft,
                                        child: Material(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(14),
                                          child: InkWell(
                                            onTap: item.onTap,
                                            borderRadius: BorderRadius.circular(14),
                                            child: Padding(
                                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                              child: Text(
                                                item.buttonLabel,
                                                style: GoogleFonts.outfit(
                                                  color: item.gradientColors.first,
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w900,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  
                  const SizedBox(height: 12),
                  
                  // 3. PAGE INDICATORS (DOTS)
                  if (_activeAnnouncements.length > 1)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_activeAnnouncements.length, (index) {
                        final isActive = _currentPageIndex == index;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: isActive ? 16 : 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: isActive
                                ? (isDark ? Colors.white : Colors.black87)
                                : (isDark ? Colors.white24 : Colors.black12),
                            borderRadius: BorderRadius.circular(3),
                          ),
                        );
                      }),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
