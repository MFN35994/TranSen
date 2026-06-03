import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:transen_core/transen_core.dart';
import 'package:flutter/foundation.dart';

class WalletTransaction {
  final String id;
  final String description;
  final double amount;
  final DateTime date;
  final String type; 
  final String status;
  final String? reference;

  WalletTransaction({
    required this.id,
    required this.description,
    required this.amount,
    required this.date,
    this.type = '',
    this.status = 'completed',
    this.reference,
  });
}

class WalletState {
  final double balance;
  final List<WalletTransaction> transactions;

  WalletState({this.balance = 0.0, this.transactions = const []});
}

class WalletNotifier extends AsyncNotifier<WalletState> {
  @override
  Future<WalletState> build() async {
    return _fetchWallet();
  }

  Future<WalletState> _fetchWallet() async {
    final auth = ref.watch(authProvider);
    if (auth == null || auth.userId.isEmpty) {
      return WalletState();
    }
    
    try {
      final apiClient = ApiClient();
      final response = await apiClient.dio.get('/api/payments/wallet/me');
      
      if (response.statusCode == 200) {
        final data = response.data;
        final double balance = (data['balance'] ?? 0).toDouble();
        final List txnsRaw = data['transactions'] ?? [];
        
        final List<WalletTransaction> transactions = txnsRaw.map((t) {
          return WalletTransaction(
            id: t['id'] ?? '',
            description: t['description'] ?? '',
            amount: (t['amount'] ?? 0).toDouble(),
            date: t['date'] != null ? DateTime.parse(t['date']) : DateTime.now(),
            type: t['type'] ?? '',
            status: t['status'] ?? 'completed',
            reference: t['reference'],
          );
        }).toList();
        
        return WalletState(balance: balance, transactions: transactions);
      }
    } catch (e) {
      debugPrint("Erreur chargement wallet: $e");
    }
    return WalletState();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchWallet());
  }
}

final walletProvider = AsyncNotifierProvider<WalletNotifier, WalletState>(WalletNotifier.new);

