
import 'package:flutter/material.dart';
import 'package:transen_core/transen_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/auth_provider.dart';
import '../providers/referral_provider.dart';

class DriverSignupScreen extends ConsumerStatefulWidget {
  const DriverSignupScreen({super.key});

  @override
  ConsumerState<DriverSignupScreen> createState() => _DriverSignupScreenState();
}

class _DriverSignupScreenState extends ConsumerState<DriverSignupScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _referralController = TextEditingController();

  bool _isLoading = false;
  bool _isScanning = false;

  Future<void> _showImagePickerSourceDialog() async {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt, color: TranSenColors.primaryGreen),
                title: const Text("Prendre une photo de mon permis / CNI"),
                onTap: () {
                  Navigator.pop(context);
                  _scanDocument(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: TranSenColors.primaryGreen),
                title: const Text("Choisir depuis la galerie"),
                onTap: () {
                  Navigator.pop(context);
                  _scanDocument(ImageSource.gallery);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _scanDocument(ImageSource source) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: source,
      imageQuality: 70,
    );

    if (image == null) return;

    setState(() => _isScanning = true);
    
    try {
      final geminiService = ref.read(geminiServiceProvider);
      if (!geminiService.isConfigured) {
        throw Exception("La clé API Gemini n'est pas configurée dans l'application mobile.");
      }

      final imageBytes = await image.readAsBytes();
      final String mimeType = image.path.endsWith('.png') ? 'image/png' : 'image/jpeg';

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Analyse de votre document en cours... 🔍"),
            backgroundColor: TranSenColors.primaryGreen,
            duration: Duration(seconds: 4),
          ),
        );
      }

      final data = await geminiService.scanDriverLicense(imageBytes, mimeType);

      if (mounted) {
        final firstName = data['firstName']?.toString() ?? '';
        final lastName = data['lastName']?.toString() ?? '';
        
        if (firstName.isNotEmpty) {
          _firstNameController.text = firstName;
        }
        if (lastName.isNotEmpty) {
          _lastNameController.text = lastName;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("✅ Informations lues et remplies !"),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Erreur de lecture du document : ${e.toString()}"),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isScanning = false);
      }
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _referralController.dispose();
    super.dispose();
  }

  Future<void> _handleSignup() async {
    if (_firstNameController.text.trim().isEmpty ||
        _lastNameController.text.trim().isEmpty ||
        _phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Veuillez remplir tous les champs"),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    try {
      await ref.read(authProvider.notifier).signUpDriver(
            firstName: _firstNameController.text.trim(),
            lastName: _lastNameController.text.trim(),
            phone: _phoneController.text.trim().replaceAll(' ', ''),
          );
      
      final auth = ref.read(authProvider);
      if (auth != null && _referralController.text.isNotEmpty) {
        await ref.read(referralProvider.notifier).validateAndApply(
          _referralController.text.trim(),
          auth.userId,
        );
      }
      
      // Lorsque l'auth state change vers 'driver', le AuthGate va automatiquement
      // rediriger vers DriverHomeScreen, mais on s'assure de fermer cet écran d'abord
      if (mounted) {
        Navigator.pop(context); // Retourner à l'AuthGate qui fera la bascule
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Erreur lors de l'inscription"),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: TranSenColors.scaffoldBg(isDarkMode),
      appBar: AppBar(
        title: const Text("Profil Chauffeur"),
        backgroundColor: isDarkMode ? TranSenColors.deepSurface : TranSenColors.darkGreen,
        foregroundColor: Colors.white,
      ),
      body: PremiumBackground(
        child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 82,
                height: 82,
                decoration: BoxDecoration(
                  color: TranSenColors.auroraGold.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(26),
                  border: Border.all(color: TranSenColors.auroraGold.withValues(alpha: 0.45)),
                ),
                child: const Icon(Icons.local_taxi_rounded, size: 42, color: TranSenColors.auroraGold),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              "Rejoignez TranSen Aurora",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 23,
                fontWeight: FontWeight.w800,
                color: TranSenColors.primaryText(isDarkMode),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "Renseignez vos informations pour activer votre espace chauffeur (5 jours d'essai offerts).",
              textAlign: TextAlign.center,
              style: TextStyle(color: TranSenColors.secondaryText(isDarkMode), fontSize: 13.5),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: _isScanning ? null : _showImagePickerSourceDialog,
              icon: _isScanning
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: TranSenColors.auroraEmeraldLight),
                    )
                  : const Icon(Icons.document_scanner_rounded, color: TranSenColors.auroraEmeraldLight),
              label: Text(
                _isScanning ? "Lecture IA du document..." : "Scanner mon permis ou CNI (IA)",
                style: const TextStyle(color: TranSenColors.auroraEmeraldLight, fontWeight: FontWeight.bold),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: TranSenColors.auroraEmeraldLight, width: 1.5),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
            const SizedBox(height: 22),

            _buildTextField(
              controller: _firstNameController,
              label: "Prénom",
              icon: Icons.person_outline,
              isDarkMode: isDarkMode,
            ),
            const SizedBox(height: 14),

            _buildTextField(
              controller: _lastNameController,
              label: "Nom",
              icon: Icons.person_outline,
              isDarkMode: isDarkMode,
            ),
            const SizedBox(height: 14),

            _buildTextField(
              controller: _phoneController,
              label: "Numéro de téléphone",
              icon: Icons.phone_android,
              keyboardType: TextInputType.phone,
              isDarkMode: isDarkMode,
            ),
            const SizedBox(height: 14),

            _buildTextField(
              controller: _referralController,
              label: "Code de parrainage (optionnel)",
              icon: Icons.card_giftcard,
              textCapitalization: TextCapitalization.characters,
              isDarkMode: isDarkMode,
            ),
            const SizedBox(height: 30),

            AuroraGradientButton(
              label: "ACTIVER MON COMPTE CHAUFFEUR",
              icon: Icons.verified_rounded,
              gold: true,
              isLoading: _isLoading,
              onPressed: _handleSignup,
            ),
          ],
        ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    TextCapitalization textCapitalization = TextCapitalization.none,
    required bool isDarkMode,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      style: TextStyle(color: TranSenColors.primaryText(isDarkMode), fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: TranSenColors.secondaryText(isDarkMode)),
        prefixIcon: Icon(icon, color: TranSenColors.auroraEmeraldLight),
        filled: true,
        fillColor: isDarkMode ? TranSenColors.glassSurface : Colors.white,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: TranSenColors.borderColor(isDarkMode)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: TranSenColors.auroraEmeraldLight, width: 1.6),
        ),
        contentPadding: const EdgeInsets.symmetric(vertical: 15, horizontal: 20),
      ),
    );
  }
}
