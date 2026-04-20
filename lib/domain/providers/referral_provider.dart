import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class ReferralNotifier extends StateNotifier<AsyncValue<String?>> {
  ReferralNotifier() : super(const AsyncValue.data(null));

  Future<bool> validateAndApply(String code, String userId) async {
    if (code.isEmpty) return true;
    
    state = const AsyncValue.loading();
    try {
      final query = await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen')
          .collection('users')
          .where('referralCode', isEqualTo: code.toUpperCase())
          .limit(1)
          .get();

      if (query.docs.isEmpty) {
        state = AsyncValue.error("Code de parrainage invalide", StackTrace.current);
        return false;
      }

      final referrerId = query.docs.first.id;
      if (referrerId == userId) {
        state = AsyncValue.error("Vous ne pouvez pas vous parrainer vous-même", StackTrace.current);
        return false;
      }

      // 1. Marquer l'utilisateur actuel comme parrainé
      await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen').collection('users').doc(userId).set({
        'referredBy': referrerId,
        'referralRewardClaimed': false,
        'bonusPoints': 500, // Petit bonus de bienvenue pour le filleul
      }, SetOptions(merge: true));

      // 2. Donner un bonus au parrain
      await FirebaseFirestore.instanceFor(app: Firebase.app(), databaseId: 'transen').collection('users').doc(referrerId).update({
        'bonusPoints': FieldValue.increment(1000), // Bonus pour le parrain
        'referralCount': FieldValue.increment(1),
      });

      state = const AsyncValue.data("Code appliqué avec succès ! +500 points bonus.");
      return true;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }
}

final referralProvider = StateNotifierProvider<ReferralNotifier, AsyncValue<String?>>((ref) {
  return ReferralNotifier();
});
