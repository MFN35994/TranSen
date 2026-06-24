import "package:flutter/foundation.dart";
import "package:firebase_core/firebase_core.dart";
import "package:cloud_firestore/cloud_firestore.dart";
import 'package:transen_core/transen_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_trips/transen_trips.dart';

final driverOccupancyProvider = StreamProvider.family<int, String>((ref, driverId) {
  return ref.watch(tripRepositoryProvider).watchDriverOccupancy(driverId);
});

final activePoolProvider = StreamProvider<TripModel?>((ref) {
  final auth = ref.watch(authProvider);
  if (auth == null) return Stream.value(null);
  
  final firestore = FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen');
  
  return firestore.collection('pools')
      .where('passengerIds', arrayContains: auth.userId)
      .snapshots()
      .map((snapshot) {
        final validPoolStatus = ['open', 'full', 'accepted', 'departed'];
        final activePools = snapshot.docs.where((doc) {
          final status = doc.data()['status'] as String? ?? 'open';
          if (status == 'open') {
            final scheduledDate = doc.data()['scheduledDate'] as String?;
            if (scheduledDate != null) {
              try {
                final parts = scheduledDate.split(' ');
                final dateParts = parts[0].split('/');
                final timeParts = parts.length > 1 ? parts[1].split(':') : ["08", "00"];
                final pDate = DateTime(
                  int.parse(dateParts[2]),
                  int.parse(dateParts[1]),
                  int.parse(dateParts[0]),
                  int.parse(timeParts[0]),
                  int.parse(timeParts[1]),
                );
                if (DateTime.now().difference(pDate).inHours > 24) {
                  return false;
                }
              } catch (_) {}
            }
          }
          return validPoolStatus.contains(status);
        }).toList();

        if (activePools.isNotEmpty) {
          final doc = activePools.first;
          final data = doc.data();
          return TripModel(
            id: doc.id,
            departure: data['departure'] ?? '',
            destination: data['destination'] ?? '',
            price: 10000,
            status: data['status'] ?? 'open',
            type: 'Covoiturage Intelligent',
            driverId: data['driverId'],
            scheduledDate: data['scheduledDate'],
            createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
          );
        }
        return null;
      });
});

final activeTripProvider = StreamProvider<TripModel?>((ref) {
  final auth = ref.watch(authProvider);
  if (auth == null) return Stream.value(null);
  
  final firestore = FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen');
  
  return firestore.collection('trips')
      .where('clientId', isEqualTo: auth.userId)
      .snapshots()
      .map((snapshot) {
        final validTripStatus = ['pending', 'accepted', 'departed'];
        final activeTrips = snapshot.docs.where((doc) {
          final status = doc.data()['status'] as String? ?? 'pending';
          if (status == 'pending') {
            final scheduledDate = doc.data()['scheduledDate'] as String?;
            if (scheduledDate != null) {
              try {
                final parts = scheduledDate.split(' ');
                final dateParts = parts[0].split('/');
                final timeParts = parts.length > 1 ? parts[1].split(':') : ["08", "00"];
                final pDate = DateTime(
                  int.parse(dateParts[2]),
                  int.parse(dateParts[1]),
                  int.parse(dateParts[0]),
                  int.parse(timeParts[0]),
                  int.parse(timeParts[1]),
                );
                if (DateTime.now().difference(pDate).inHours > 24) {
                  return false;
                }
              } catch (_) {}
            }
          }
          return validTripStatus.contains(status);
        }).toList();

        if (activeTrips.isNotEmpty) {
          return TripModel.fromFirestore(activeTrips.first);
        }
        return null;
      });
});

final driverActivePoolProvider = StreamProvider<PoolModel?>((ref) {
  final auth = ref.watch(authProvider);
  if (auth == null || auth.userId.isEmpty) return Stream.value(null);
  
  final firestore = FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen');
  
  return firestore.collection('pools')
      .where('driverId', isEqualTo: auth.userId)
      .where('status', whereIn: ['accepted', 'departed'])
      .snapshots()
      .map((snapshot) {
        if (snapshot.docs.isNotEmpty) {
          return PoolModel.fromFirestore(snapshot.docs.first);
        }
        return null;
      });
});

final driverActiveTripProvider = StreamProvider<TripModel?>((ref) {
  final auth = ref.watch(authProvider);
  if (auth == null || auth.userId.isEmpty) return Stream.value(null);
  
  return FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen').collection('trips')
      .where('driverId', isEqualTo: auth.userId)
      .where('status', whereIn: const ['accepted', 'departed'])
      .snapshots()
      .map((snapshot) {
        final vtcTrips = snapshot.docs.where((doc) {
          final type = (doc.data()['type'] as String? ?? '').toLowerCase();
          return !type.contains('livraison') && !type.contains('colis') && !type.contains('yobante');
        });
        if (vtcTrips.isNotEmpty) {
          return TripModel.fromFirestore(vtcTrips.first);
        }
        return null;
      });
});

final driverActiveDeliveriesProvider = StreamProvider<List<TripModel>>((ref) {
  final auth = ref.watch(authProvider);
  if (auth == null || auth.userId.isEmpty) return Stream.value([]);
  
  return FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen').collection('trips')
      .where('driverId', isEqualTo: auth.userId)
      .where('status', whereIn: const ['accepted', 'departed'])
      .snapshots()
      .map((snapshot) {
        return snapshot.docs.where((doc) {
          final type = (doc.data()['type'] as String? ?? '').toLowerCase();
          return type.contains('livraison') || type.contains('colis') || type.contains('yobante');
        }).map((doc) => TripModel.fromFirestore(doc)).toList();
      });
});

final tripHistoryProvider = FutureProvider.family<List<TripModel>, String>((ref, userId) async {
  return ref.read(tripRepositoryProvider).getUserTrips(userId);
});

final demandHeatmapProvider = StreamProvider<Map<String, int>>((ref) {
  return ref.watch(tripRepositoryProvider).watchDemandHeatmap();
});

final demandHeatpointsProvider = StreamProvider<List<Map<String, double>>>((ref) {
  return ref.watch(tripRepositoryProvider).watchDemandHeatpoints();
});

final activeCompanyBookingProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final auth = ref.watch(authProvider);
  if (auth == null) return null;

  try {
    final response = await ApiClient().dio.get('/api/bookings/active');
    if (response.statusCode == 200 && response.data is List) {
      final List bookings = response.data;
      if (bookings.isNotEmpty) {
        return Map<String, dynamic>.from(bookings.first);
      }
    }
  } catch (e) {
    debugPrint("Erreur activeCompanyBookingProvider: $e");
  }
  return null;
});

final activeCompanyTripProvider = StreamProvider<TripModel?>((ref) {
  final bookingAsync = ref.watch(activeCompanyBookingProvider);

  return bookingAsync.when(
    data: (booking) {
      if (booking == null) return Stream.value(null);
      final tripId = booking['tripId'] as String?;
      if (tripId == null || tripId.isEmpty) return Stream.value(null);

      final firestore = FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen');
      return firestore.collection('trips').doc(tripId).snapshots().map((doc) {
        if (!doc.exists) return null;
        final trip = TripModel.fromFirestore(doc);
        if (trip.status == 'completed' || trip.status == 'cancelled') {
          ref.invalidate(activeCompanyBookingProvider);
          return null;
        }
        return trip;
      });
    },
    loading: () => Stream.value(null),
    error: (_, __) => Stream.value(null),
  );
});
