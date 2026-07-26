import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

String get _defaultApiBaseUrl {
  if (kIsWeb || defaultTargetPlatform == TargetPlatform.windows) {
    return 'http://localhost:8000';
  }
  return 'http://10.0.2.2:8000';
}

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');

final apiBaseUrlProvider = Provider<String>((ref) =>
    _configuredApiBaseUrl.isEmpty ? _defaultApiBaseUrl : _configuredApiBaseUrl);
final apiClientProvider =
    Provider<ApiClient>((ref) => ApiClient(ref.watch(apiBaseUrlProvider)));
final searchProvider =
    StateNotifierProvider<SearchController, SearchState>((ref) {
  return SearchController(ref.watch(apiClientProvider));
});
final authProvider =
    StateNotifierProvider<AuthController, AsyncValue<User?>>((ref) {
  return AuthController();
});

void main() {
  runApp(const ProviderScope(child: SmartTripApp()));
}

class SmartTripApp extends StatelessWidget {
  const SmartTripApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SmartTrip AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF006A62)),
        useMaterial3: true,
      ),
      home: const TripSearchScreen(),
    );
  }
}

class TripSearchScreen extends ConsumerStatefulWidget {
  const TripSearchScreen({super.key});

  @override
  ConsumerState<TripSearchScreen> createState() => _TripSearchScreenState();
}

class _TripSearchScreenState extends ConsumerState<TripSearchScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fromCity = TextEditingController(text: 'Pune');
  final _toCity = TextEditingController(text: 'Bangalore');
  final _latitude = TextEditingController(text: '18.5492');
  final _longitude = TextEditingController(text: '73.7431');
  DateTime _travelDate = DateTime.now().add(const Duration(days: 1));

  @override
  void dispose() {
    _fromCity.dispose();
    _toCity.dispose();
    _latitude.dispose();
    _longitude.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final selected = await showDatePicker(
      context: context,
      initialDate: _travelDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (selected != null) setState(() => _travelDate = selected);
  }

  void _search() {
    if (!_formKey.currentState!.validate()) return;
    ref.read(searchProvider.notifier).search(
          fromCity: _fromCity.text.trim(),
          toCity: _toCity.text.trim(),
          latitude: double.parse(_latitude.text),
          longitude: double.parse(_longitude.text),
          travelDate: _travelDate,
        );
  }

  @override
  Widget build(BuildContext context) {
    final search = ref.watch(searchProvider);
    final auth = ref.watch(authProvider);
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('SmartTrip AI'),
        backgroundColor: colors.surfaceContainerHighest,
        actions: [
          IconButton(
            tooltip: auth.valueOrNull == null ? 'Sign in' : 'Sign out',
            icon: Icon(auth.valueOrNull == null
                ? Icons.account_circle_outlined
                : Icons.logout),
            onPressed: () {
              if (auth.valueOrNull == null) {
                showModalBottomSheet<void>(
                  context: context,
                  isScrollControlled: true,
                  builder: (_) => const AuthSheet(),
                );
              } else {
                ref.read(authProvider.notifier).signOut();
              }
            },
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text('Plan your door-to-door trip',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            const Text(
                'Compare feeder, bus, train, and flight options from SmartTrip.'),
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _fromCity,
                        decoration: const InputDecoration(
                            labelText: 'From city',
                            prefixIcon: Icon(Icons.trip_origin)),
                        validator: _required,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _toCity,
                        decoration: const InputDecoration(
                            labelText: 'To city',
                            prefixIcon: Icon(Icons.location_on_outlined)),
                        validator: _required,
                      ),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(
                            child: _numberField(
                                _latitude, 'Pickup latitude', -90, 90)),
                        const SizedBox(width: 12),
                        Expanded(
                            child: _numberField(
                                _longitude, 'Pickup longitude', -180, 180)),
                      ]),
                      const SizedBox(height: 12),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.calendar_today_outlined),
                        title: const Text('Travel date'),
                        subtitle: Text(MaterialLocalizations.of(context)
                            .formatMediumDate(_travelDate)),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: _pickDate,
                      ),
                      const SizedBox(height: 8),
                      FilledButton.icon(
                        onPressed: search.isLoading ? null : _search,
                        icon: search.isLoading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.search),
                        label: Text(
                            search.isLoading ? 'Searching…' : 'Find journeys'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (search.error != null) ...[
              const SizedBox(height: 16),
              _ErrorCard(message: search.error!),
            ],
            if (search.hasSearched &&
                !search.isLoading &&
                search.journeys.isEmpty) ...[
              const SizedBox(height: 16),
              const Card(
                  child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Text('No journeys found for this route.'))),
            ],
            if (search.journeys.isNotEmpty) ...[
              const SizedBox(height: 20),
              Text('Available journeys',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              for (final journey in search.journeys)
                JourneyCard(journey: journey),
            ],
          ],
        ),
      ),
    );
  }

  Widget _numberField(
      TextEditingController controller, String label, double min, double max) {
    return TextFormField(
      controller: controller,
      keyboardType:
          const TextInputType.numberWithOptions(decimal: true, signed: true),
      decoration: InputDecoration(labelText: label),
      validator: (value) {
        final number = double.tryParse(value ?? '');
        if (number == null || number < min || number > max) {
          return 'Use $min to $max';
        }
        return null;
      },
    );
  }
}

String? _required(String? value) =>
    value == null || value.trim().isEmpty ? 'This field is required' : null;

class JourneyCard extends StatelessWidget {
  const JourneyCard({required this.journey, super.key});
  final JourneySummary journey;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(journey.summary, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(spacing: 12, runSpacing: 6, children: [
            _Metric(
                icon: Icons.currency_rupee,
                label: '₹${journey.totalFare.toStringAsFixed(0)}'),
            _Metric(
                icon: Icons.schedule,
                label: _formatDuration(journey.durationSeconds)),
            _Metric(icon: Icons.directions, label: journey.modes.join(' → ')),
          ]),
        ]),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.label});
  final IconData icon;
  final String label;
  @override
  Widget build(BuildContext context) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [Icon(icon, size: 18), const SizedBox(width: 4), Text(label)]);
}

String _formatDuration(int seconds) {
  final hours = seconds ~/ 3600;
  final minutes = (seconds % 3600) ~/ 60;
  return hours == 0 ? '${minutes}m' : '${hours}h ${minutes}m';
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) => Card(
        color: Theme.of(context).colorScheme.errorContainer,
        child: Padding(padding: const EdgeInsets.all(16), child: Text(message)),
      );
}

class SearchState {
  const SearchState(
      {this.isLoading = false,
      this.hasSearched = false,
      this.journeys = const [],
      this.error});
  final bool isLoading;
  final bool hasSearched;
  final List<JourneySummary> journeys;
  final String? error;
}

class SearchController extends StateNotifier<SearchState> {
  SearchController(this._api) : super(const SearchState());
  final ApiClient _api;

  Future<void> search(
      {required String fromCity,
      required String toCity,
      required double latitude,
      required double longitude,
      required DateTime travelDate}) async {
    state = const SearchState(isLoading: true, hasSearched: true);
    try {
      final journeys = await _api.search(
        fromCity: fromCity,
        toCity: toCity,
        latitude: latitude,
        longitude: longitude,
        travelDate: travelDate,
      );
      state = SearchState(hasSearched: true, journeys: journeys);
    } on ApiException catch (error) {
      state = SearchState(hasSearched: true, error: error.message);
    }
  }
}

class ApiClient {
  ApiClient(this.baseUrl);
  final String baseUrl;

  Future<List<JourneySummary>> search(
      {required String fromCity,
      required String toCity,
      required double latitude,
      required double longitude,
      required DateTime travelDate}) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/v1/search/'),
            headers: const {'Content-Type': 'application/json'},
            body: jsonEncode({
              'from_city': fromCity,
              'to_city': toCity,
              'from_lat': latitude,
              'from_lon': longitude,
              'travel_date': travelDate.toIso8601String(),
            }),
          )
          .timeout(const Duration(seconds: 15));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(
            'SmartTrip could not search right now (${response.statusCode}).');
      }
      final payload = jsonDecode(response.body);
      if (payload is! List) {
        throw const ApiException(
            'The server returned an invalid journey response.');
      }
      return payload
          .map((item) => JourneySummary.fromJson(item as Map<String, dynamic>))
          .toList();
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException(
          'Could not reach SmartTrip. Check that the API is running and the backend URL is correct.');
    }
  }
}

class ApiException implements Exception {
  const ApiException(this.message);
  final String message;
}

class JourneySummary {
  const JourneySummary(
      {required this.summary,
      required this.totalFare,
      required this.durationSeconds,
      required this.modes});
  final String summary;
  final double totalFare;
  final int durationSeconds;
  final List<String> modes;

  factory JourneySummary.fromJson(Map<String, dynamic> json) {
    final legs = json['legs'] as List<dynamic>? ?? const [];
    return JourneySummary(
      summary: json['summary'] as String? ?? 'SmartTrip journey',
      totalFare: (json['total_fare'] as num?)?.toDouble() ?? 0,
      durationSeconds: (json['total_duration_seconds'] as num?)?.toInt() ?? 0,
      modes: legs
          .map((leg) =>
              (leg as Map<String, dynamic>)['mode'] as String? ?? 'TRIP')
          .toList(),
    );
  }
}

class AuthController extends StateNotifier<AsyncValue<User?>> {
  AuthController() : super(const AsyncData(null));

  Future<void> signIn(
      {required String email,
      required String password,
      required bool register}) async {
    state = const AsyncLoading();
    try {
      if (Firebase.apps.isEmpty) await Firebase.initializeApp();
      final credential = register
          ? await FirebaseAuth.instance
              .createUserWithEmailAndPassword(email: email, password: password)
          : await FirebaseAuth.instance
              .signInWithEmailAndPassword(email: email, password: password);
      state = AsyncData(credential.user);
    } on FirebaseAuthException catch (error) {
      state = AsyncError(
          error.message ?? 'Authentication failed.', StackTrace.current);
    } catch (_) {
      state = AsyncError(
          'Firebase is not configured yet. Add android/app/google-services.json and enable Email/Password sign-in in Firebase.',
          StackTrace.current);
    }
  }

  Future<void> signOut() async {
    await FirebaseAuth.instance.signOut();
    state = const AsyncData(null);
  }
}

class AuthSheet extends ConsumerStatefulWidget {
  const AuthSheet({super.key});
  @override
  ConsumerState<AuthSheet> createState() => _AuthSheetState();
}

class _AuthSheetState extends ConsumerState<AuthSheet> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _register = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    return Padding(
      padding: EdgeInsets.fromLTRB(
          24, 24, 24, 24 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(_register ? 'Create account' : 'Sign in',
            style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email')),
        const SizedBox(height: 12),
        TextField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(
                labelText: 'Password (minimum 6 characters)')),
        if (auth.hasError)
          Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text('${auth.error}',
                  style:
                      TextStyle(color: Theme.of(context).colorScheme.error))),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: auth.isLoading
              ? null
              : () async {
                  final navigator = Navigator.of(context);
                  await ref.read(authProvider.notifier).signIn(
                      email: _email.text.trim(),
                      password: _password.text,
                      register: _register);
                  if (!mounted) {
                    return;
                  }
                  if (ref.read(authProvider).valueOrNull != null) {
                    navigator.pop();
                  }
                },
          child: Text(_register ? 'Create account' : 'Sign in'),
        ),
        TextButton(
            onPressed: () => setState(() => _register = !_register),
            child: Text(_register
                ? 'I already have an account'
                : 'Create a new account')),
      ]),
    );
  }
}
