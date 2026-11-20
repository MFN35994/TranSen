import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart' show kIsWeb, kReleaseMode;
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:transen_core/transen_core.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_trips/transen_trips.dart';
import 'firebase_options.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'presentation/onboarding/onboarding_screen.dart';
import 'presentation/splash/splash_screen.dart';
import 'presentation/home/home_screen.dart';
import 'presentation/driver/driver_home_screen.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'src/generated/l10n/app_localizations.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' hide Settings;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Style système immersif TranSen Aurora
  if (!kIsWeb) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: TranSenColors.obsidianBg,
        systemNavigationBarIconBrightness: Brightness.light,
      ),
    );
    // Initialisation de Mapbox uniquement sur Mobile (Android / iOS)
    MapboxOptions.setAccessToken(LocationHelper.mapboxToken);
  }

  final prefs = await SharedPreferences.getInstance();

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // 1. Initialisation App Check isolée pour ne jamais bloquer Firestore / FCM sur Web
    if (!kIsWeb) {
      try {
        await FirebaseAppCheck.instance.activate(
          providerAndroid: kReleaseMode
              ? const AndroidPlayIntegrityProvider()
              : const AndroidDebugProvider(),
          providerApple: kReleaseMode
              ? const AppleAppAttestProvider()
              : const AppleDebugProvider(),
        );
      } catch (appCheckErr) {
        debugPrint("Firebase AppCheck warning: $appCheckErr");
      }
    }

    // 2. Configuration Firestore (persistence offline activée sur Mobile)
    FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
        .settings = const Settings(persistenceEnabled: !kIsWeb);

    // 3. Notifications Push (Mobile uniquement)
    if (!kIsWeb) {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      NotificationService.listenToMessages();
    }
  } catch (e) {
    debugPrint("Firebase init warning: $e");
  }

  runApp(
    ProviderScope(
      overrides: [
        localeProvider.overrideWith(() => LocaleNotifier()..init(prefs)),
        themeProvider.overrideWith(() => ThemeNotifier()..init(prefs)),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final locale = ref.watch(localeProvider);

    return MaterialApp(
      title: 'TranSen Aurora',
      debugShowCheckedModeBanner: false,
      locale: locale,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        _FallbackMaterialLocalizationsDelegate(),
        _FallbackCupertinoLocalizationsDelegate(),
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('fr'),
        Locale('en'),
        Locale('wo'),
      ],
      themeMode: themeMode,
      theme: TranSenTheme.light(),
      darkTheme: TranSenTheme.dark(),
      home: const InitialGate(),
    );
  }
}

class InitialGate extends StatefulWidget {
  const InitialGate({super.key});

  @override
  State<InitialGate> createState() => _InitialGateState();
}

class _InitialGateState extends State<InitialGate> {
  bool? _seenOnboarding;
  String? _emergencyBanner;
  bool _bannerDismissed = false;

  @override
  void initState() {
    super.initState();
    _checkOnboarding();
    _pingTelemetryAndBanner();

    NotificationService.onTripNotificationClicked = (tripId) {
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => TripTrackingScreen(tripId: tripId),
          ),
        );
      }
    };
  }

  Future<void> _checkOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _seenOnboarding = prefs.getBool('onboarding_seen') ?? false;
    });
  }

  Future<void> _pingTelemetryAndBanner() async {
    final sw = Stopwatch()..start();
    final res = await ApiClient().sendTelemetry(
      'USER_PROFILE_MOBILE',
      latencyMs: sw.elapsedMilliseconds.clamp(12, 800),
    );
    if (!mounted || res == null) return;
    final banner = res['emergencyBanner']?.toString().trim();
    if (banner != null && banner.isNotEmpty) {
      setState(() => _emergencyBanner = banner);
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget content;
    if (_seenOnboarding == null) {
      content = const SplashScreen();
    } else if (_seenOnboarding == false) {
      content = const OnboardingScreen();
    } else {
      content = const AuthGate();
    }

    if (_emergencyBanner == null || _bannerDismissed) {
      return content;
    }

    return Column(
      children: [
        Material(
          color: const Color(0xFFB91C1C),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Row(
                children: [
                  const Icon(Icons.campaign_rounded, color: Colors.white, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _emergencyBanner!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  InkWell(
                    onTap: () => setState(() => _bannerDismissed = true),
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Icon(Icons.close, color: Colors.white70, size: 16),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Expanded(child: content),
      ],
    );
  }
}

class AuthGate extends ConsumerStatefulWidget {
  const AuthGate({super.key});

  @override
  ConsumerState<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends ConsumerState<AuthGate> {
  String? _notifiedUserId;

  void _ensureNotificationsFor(String userId) {
    if (userId.isEmpty || _notifiedUserId == userId) return;
    _notifiedUserId = userId;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      NotificationService().init(userId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    if (authState == null || authState.userId.isEmpty) {
      _notifiedUserId = null;
      return const LoginScreen();
    }

    return authState.when(
      data: (auth) {
        if (auth.name == null || auth.name!.isEmpty) {
          return const LoginScreen();
        }

        _ensureNotificationsFor(auth.userId);

        if (auth.role == 'driver') {
          return const DriverHomeScreen();
        } else if (auth.role == 'client') {
          return const HomeScreen();
        } else {
          return const RoleSelectionScreen();
        }
      },
      loading: () => const SplashScreen(),
      error: (e, stack) => Scaffold(
        backgroundColor: TranSenColors.obsidianBg,
        body: PremiumBackground(
          child: SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: AuroraGlassCard(
                  accentColor: TranSenColors.auroraRose,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.shield_outlined, color: TranSenColors.auroraRose, size: 48),
                      const SizedBox(height: 16),
                      const Text(
                        "Session interrompue",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: TranSenColors.auroraTextPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        e.toString().replaceAll('Exception: ', ''),
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: TranSenColors.auroraTextSecondary, fontSize: 13),
                      ),
                      const SizedBox(height: 22),
                      AuroraGradientButton(
                        label: "REVENIR À LA CONNEXION",
                        icon: Icons.refresh_rounded,
                        onPressed: () => ref.read(authProvider.notifier).logout(),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FallbackMaterialLocalizationsDelegate extends LocalizationsDelegate<MaterialLocalizations> {
  const _FallbackMaterialLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => locale.languageCode == 'wo';

  @override
  Future<MaterialLocalizations> load(Locale locale) =>
      GlobalMaterialLocalizations.delegate.load(const Locale('fr'));

  @override
  bool shouldReload(_FallbackMaterialLocalizationsDelegate old) => false;
}

class _FallbackCupertinoLocalizationsDelegate extends LocalizationsDelegate<CupertinoLocalizations> {
  const _FallbackCupertinoLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => locale.languageCode == 'wo';

  @override
  Future<CupertinoLocalizations> load(Locale locale) =>
      GlobalCupertinoLocalizations.delegate.load(const Locale('fr'));

  @override
  bool shouldReload(_FallbackCupertinoLocalizationsDelegate old) => false;
}
