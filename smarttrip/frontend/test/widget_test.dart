import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smarttrip_app/main.dart';

void main() {
  testWidgets('shows the SmartTrip search experience', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: SmartTripApp()));

    expect(find.text('Plan your door-to-door trip'), findsOneWidget);
    expect(find.text('Find journeys'), findsOneWidget);
    expect(find.text('Pune'), findsOneWidget);
  });
}
