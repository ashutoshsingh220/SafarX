import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Riverpod provider for journey state
final journeyIdProvider = StateProvider<String?>((ref) => null);
final trackingLocationProvider = StateProvider<String>((ref) => 'Awaiting Location...');

void main() {
  runApp(
    const ProviderScope(
      child: SmartTripApp(),
    ),
  );
}

class SmartTripApp extends StatelessWidget {
  const SmartTripApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SmartTrip AI',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
      ),
      home: const MapScreen(),
    );
  }
}

class MapScreen extends ConsumerWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final journeyId = ref.watch(journeyIdProvider);
    final location = ref.watch(trackingLocationProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('SmartTrip: Door-to-Door Search'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Stack(
        children: [
          // Mock Mapbox UI (A colored container representing the map)
          Container(
            color: Colors.blueGrey[100],
            child: const Center(
              child: Text(
                'Map View (Mocked)',
                style: TextStyle(fontSize: 24, color: Colors.black54),
              ),
            ),
          ),
          
          // Floating Action Panel
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: Card(
              elevation: 8,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (journeyId == null) ...[
                      const Text(
                        'Where do you want to go?',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      ElevatedButton(
                        onPressed: () {
                          // Mock hitting the API and getting a journey
                          ref.read(journeyIdProvider.notifier).state = 'J1';
                          ref.read(trackingLocationProvider.notifier).state = 'Tracking Driver...';
                        },
                        child: const Text('Search & Book'),
                      ),
                    ] else ...[
                      Text(
                        'Active Journey: $journeyId',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 5),
                      Text('Status: $location'),
                      const SizedBox(height: 10),
                      TextButton(
                        onPressed: () {
                          // Reset
                          ref.read(journeyIdProvider.notifier).state = null;
                        },
                        child: const Text('Cancel Trip', style: TextStyle(color: Colors.red)),
                      )
                    ]
                  ],
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}
