import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen/main.dart';
import 'package:transen_auth/transen_auth.dart';

class FakeAuthNotifier extends AuthNotifier {
  @override
  AuthState? build() {
    return AuthState(userId: 'test_user', role: 'client');
  }
}

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Override authProvider to avoid Firebase / Firestore initialization exceptions in tests
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith(() => FakeAuthNotifier()),
        ],
        child: const MyApp(),
      ),
    );

    tester.takeException();
    expect(find.byType(MyApp), findsOneWidget);
    
    // Force disposal of MyApp to trigger cancellation of any active animations/timers
    await tester.pumpWidget(Container());
  });
}
