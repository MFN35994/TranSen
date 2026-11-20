import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Fonction globale pour gérer les messages en arrière-plan
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling a background message: ${message.messageId}");
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'high_importance_channel',
    'High Importance Notifications',
    description: 'This channel is used for important notifications.',
    importance: Importance.max,
  );

  final Map<String, StreamSubscription> _chatSubscriptions = {};
  final Map<String, String> _knownTripStatuses = {};
  StreamSubscription? _tripStatusSub;
  StreamSubscription? _chatTripsSub;
  StreamSubscription? _chatPoolsSub;
  StreamSubscription? _tokenRefreshSub;

  bool _isInitialized = false;
  String? _initializedUserId;

  Future<void> init(String userId) async {
    if (userId.isEmpty) return;
    if (_isInitialized && _initializedUserId == userId) return;

    // Si on change d'utilisateur, nettoyer d'abord les anciens listeners
    if (_initializedUserId != null && _initializedUserId != userId) {
      await reset();
    }

    _isInitialized = true;
    _initializedUserId = userId;

    // Sur Flutter Web, les notifications locales natives ne sont pas disponibles
    if (kIsWeb) {
      debugPrint('NotificationService: mode Web léger activé pour $userId');
      return;
    }

    try {
      final NotificationSettings settings = await _fcm.requestPermission(
        alert: true,
        badge: true,
        provisional: false,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('User granted notification permission');

        await _initLocalNotifications();

        final String? token = await _fcm.getToken();
        if (token != null) {
          await _saveTokenToDatabase(userId, token);
        }

        _tokenRefreshSub?.cancel();
        _tokenRefreshSub = _fcm.onTokenRefresh.listen((newToken) {
          _saveTokenToDatabase(userId, newToken);
        });

        _fcm.getInitialMessage().then((RemoteMessage? message) {
          if (message != null) {
            final tripId = message.data['tripId'] ?? message.data['payload'];
            if (tripId != null) {
              Future.delayed(const Duration(milliseconds: 1200), () {
                if (onTripNotificationClicked != null) {
                  onTripNotificationClicked!(tripId);
                }
              });
            }
          }
        });

        startChatListener(userId);
        startTripStatusListener(userId);
      }
    } catch (e) {
      debugPrint('NotificationService init warning: $e');
    }
  }

  /// Annule proprement tous les écouteurs Firestore lors de la déconnexion
  Future<void> reset() async {
    await _tripStatusSub?.cancel();
    await _chatTripsSub?.cancel();
    await _chatPoolsSub?.cancel();
    await _tokenRefreshSub?.cancel();
    _tripStatusSub = null;
    _chatTripsSub = null;
    _chatPoolsSub = null;
    _tokenRefreshSub = null;

    for (final sub in _chatSubscriptions.values) {
      await sub.cancel();
    }
    _chatSubscriptions.clear();
    _knownTripStatuses.clear();
    _isInitialized = false;
    _initializedUserId = null;
  }

  void startTripStatusListener(String userId) {
    _tripStatusSub?.cancel();
    final db = FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen');

    _tripStatusSub = db
        .collection('trips')
        .where('clientId', isEqualTo: userId)
        .snapshots()
        .listen(
      (snapshot) {
        for (var change in snapshot.docChanges) {
          final data = change.doc.data();
          if (data == null) continue;

          final tripId = change.doc.id;
          final status = data['status'] as String?;

          if (change.type == DocumentChangeType.added) {
            _knownTripStatuses[tripId] = status ?? '';
          } else if (change.type == DocumentChangeType.modified) {
            final oldStatus = _knownTripStatuses[tripId];
            if (oldStatus != status) {
              _knownTripStatuses[tripId] = status ?? '';

              if (status == 'accepted') {
                _showLocalNotification(
                  "Chauffeur en route ! 🚗",
                  "Votre chauffeur a accepté la course et se dirige vers vous.",
                  payload: tripId,
                );
              } else if (status == 'departed') {
                _showLocalNotification(
                  "Course démarrée 🚀",
                  "Attachez votre ceinture, le trajet a commencé.",
                  payload: tripId,
                );
              } else if (status == 'arrived') {
                _showLocalNotification(
                  "Chauffeur sur place 📍",
                  "Votre chauffeur est arrivé au point de rendez-vous.",
                  payload: tripId,
                );
              }
            }
          }
        }
      },
      onError: (e) => debugPrint('TripStatusListener warning: $e'),
    );
  }

  void startChatListener(String userId) {
    _chatTripsSub?.cancel();
    _chatPoolsSub?.cancel();
    final db = FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen');

    _chatTripsSub = db
        .collection('trips')
        .where(Filter.or(
          Filter('clientId', isEqualTo: userId),
          Filter('driverId', isEqualTo: userId),
        ))
        .snapshots()
        .listen(
      (snapshot) {
        _manageChatSubscriptions(userId, snapshot.docs, 'trips');
      },
      onError: (e) => debugPrint('ChatTripsListener warning: $e'),
    );

    _chatPoolsSub = db
        .collection('pools')
        .where(Filter.or(
          Filter('passengerIds', arrayContains: userId),
          Filter('driverId', isEqualTo: userId),
        ))
        .snapshots()
        .listen(
      (snapshot) {
        _manageChatSubscriptions(userId, snapshot.docs, 'pools');
      },
      onError: (e) => debugPrint('ChatPoolsListener warning: $e'),
    );
  }

  void _manageChatSubscriptions(String userId, List<QueryDocumentSnapshot> docs, String collectionName) {
    final activeIds = docs.map((d) => d.id).toSet();

    _chatSubscriptions.removeWhere((key, sub) {
      if (key.startsWith("${collectionName}_")) {
        final tripId = key.substring(collectionName.length + 1);
        if (!activeIds.contains(tripId)) {
          sub.cancel();
          return true;
        }
      }
      return false;
    });

    for (var doc in docs) {
      final tripId = doc.id;
      final key = "${collectionName}_$tripId";
      if (!_chatSubscriptions.containsKey(key)) {
        final data = doc.data() as Map<String, dynamic>;
        final status = data['status'] as String?;

        if (status == 'completed' || status == 'cancelled') continue;

        _chatSubscriptions[key] = FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
            .collection(collectionName)
            .doc(tripId)
            .collection('messages')
            .orderBy('timestamp', descending: true)
            .limit(1)
            .snapshots()
            .listen(
          (msgSnapshot) {
            if (msgSnapshot.docs.isNotEmpty) {
              final msgData = msgSnapshot.docs.first.data();
              final senderId = msgData['senderId'] as String?;
              final timestamp = msgData['timestamp'] as Timestamp?;

              if (senderId != userId && timestamp != null) {
                final diff = DateTime.now().difference(timestamp.toDate()).inSeconds;
                if (diff.abs() < 30) {
                  _showLocalNotification(
                    "Nouveau message",
                    msgData['text'] ?? "Vous avez reçu un message",
                    payload: tripId,
                  );
                }
              }
            }
          },
          onError: (e) => debugPrint('ChatMsgListener warning: $e'),
        );
      }
    }
  }

  Future<void> _initLocalNotifications() async {
    if (kIsWeb) return;
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings();

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    await _localNotifications.initialize(
      settings: initializationSettings,
      onDidReceiveNotificationResponse: (details) {
        debugPrint("Notification clicked: ${details.payload}");
        if (details.payload != null && onTripNotificationClicked != null) {
          onTripNotificationClicked!(details.payload!);
        }
      },
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);
  }

  Future<void> _saveTokenToDatabase(String userId, String token) async {
    try {
      await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
          .collection('users')
          .doc(userId)
          .set({
        'fcmToken': token,
        'lastTokenUpdate': FieldValue.serverTimestamp(),
        'platform': defaultTargetPlatform.toString().split('.').last,
      }, SetOptions(merge: true));
      debugPrint('FCM Token saved for user: $userId');
    } catch (e) {
      debugPrint('Error saving FCM Token: $e');
    }
  }

  Future<void> _showLocalNotification(String title, String body, {String? payload}) async {
    if (kIsWeb) return;
    const androidDetails = AndroidNotificationDetails(
      'internal_messages',
      'Messages Internes',
      channelDescription: 'Notifications pour les messages du chat',
      importance: Importance.max,
      priority: Priority.high,
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: DarwinNotificationDetails(),
    );

    await _localNotifications.show(
      id: DateTime.now().millisecond,
      title: title,
      body: body,
      notificationDetails: notificationDetails,
      payload: payload,
    );
  }

  static void Function(String tripId)? onTripNotificationClicked;

  static void listenToMessages() {
    if (kIsWeb) return;
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final RemoteNotification? notification = message.notification;
      final AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null && !kIsWeb) {
        FlutterLocalNotificationsPlugin().show(
          id: notification.hashCode,
          title: notification.title,
          body: notification.body,
          notificationDetails: NotificationDetails(
            android: AndroidNotificationDetails(
              _channel.id,
              _channel.name,
              channelDescription: _channel.description,
              icon: android.smallIcon,
              importance: Importance.max,
              priority: Priority.high,
            ),
          ),
          payload: message.data['tripId'] ?? message.data['payload'],
        );
      }

      debugPrint('Message reçu au premier plan: ${notification?.title}');
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('Notification cliquée! Message ID: ${message.messageId}');
      final tripId = message.data['tripId'] ?? message.data['payload'];
      if (tripId != null && onTripNotificationClicked != null) {
        onTripNotificationClicked!(tripId);
      }
    });
  }
}
