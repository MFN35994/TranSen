import 'package:flutter/material.dart';
import 'package:transen_core/transen_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:transen_auth/transen_auth.dart';
import 'package:image_picker/image_picker.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  int _refreshCounter = 0;

  void _triggerRefresh() {
    setState(() {
      _refreshCounter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final userId = auth?.userId ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon Profil'),
        backgroundColor: auth?.role == 'driver' ? Colors.black87 : TranSenColors.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: userId.isEmpty 
        ? const Center(child: CircularProgressIndicator())
        : FutureBuilder<Map<String, dynamic>?>(
            key: ValueKey(_refreshCounter),
            future: ref.read(userRepositoryProvider).getUserData(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              
              final userData = snapshot.data;
              debugPrint("ProfileScreen: UserID=$userId, DataExist=${userData != null}");
              
              String name = userData?['name'] ?? '';
              if (name.isEmpty && userData?['firstName'] != null) {
                name = "${userData!['firstName']} ${userData['lastName'] ?? ''}";
              }
              if (name.isEmpty) {
                name = auth?.role == 'driver' ? 'Chauffeur TranSen' : 'Client TranSen';
              }
              
              String phone = userData?['phone'] ?? (userData?['phoneNumber'] ?? '');
              if (phone.trim() == '+221' || phone.trim().isEmpty || phone.trim().length <= 4) {
                if (auth?.phone != null && auth!.phone!.length > 4) {
                  phone = auth.phone!;
                } else {
                  phone = 'Non renseigné';
                }
              }
              final bool isVerified = userData?['isVerified'] ?? false;
              final int points = (userData?['loyaltyPoints'] ?? 0) as int;
              final String? avatarUrl = userData?['avatarUrl'] as String?;

              return SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    Center(
                      child: GestureDetector(
                        onTap: () => _pickAndUploadAvatar(context),
                        child: Stack(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Theme.of(context).brightness == Brightness.light ? Colors.grey[200] : Colors.grey[800],
                                shape: BoxShape.circle,
                              ),
                              child: CircleAvatar(
                                radius: 60,
                                backgroundColor: Theme.of(context).brightness == Brightness.light ? Colors.white : Colors.grey[900],
                                backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
                                child: avatarUrl != null && avatarUrl.isNotEmpty 
                                  ? null 
                                  : const Icon(Icons.person, size: 70, color: Colors.grey),
                              ),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: auth?.role == 'driver' ? Colors.black : TranSenColors.primaryGreen,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 30),
                    _buildInfoCard(context, 'Nom complet', name, Icons.person_outline, trailing: isVerified ? const Icon(Icons.verified, color: Colors.blue, size: 20) : null),
                    _buildInfoCard(context, 'Téléphone', phone, Icons.phone_outlined),
                    _buildInfoCard(context, 'Rôle', auth?.role.toUpperCase() ?? '', Icons.badge_outlined),
                    _buildInfoCard(context, 'Points Fidélité', '$points pts', Icons.stars_rounded),
                    
                    if (auth?.role == 'driver' && !isVerified) ...[
                      const SizedBox(height: 30),
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.amber.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                        ),
                        child: Column(
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.warning_amber_rounded, color: TranSenColors.primaryGreen),
                                SizedBox(width: 10),
                                Text("Compte non vérifié", style: TextStyle(fontWeight: FontWeight.bold, color: TranSenColors.primaryGreen)),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              "Le module de vérification des documents (CNI, Permis) est en cours de construction. Vous pourrez bientôt télécharger vos documents directement dans l'application.",
                              style: TextStyle(fontSize: 13, color: Theme.of(context).brightness == Brightness.light ? Colors.black87 : Colors.white70),
                            ),
                            const SizedBox(height: 15),
                            ElevatedButton.icon(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text("Fonctionnalité en cours de développement..."),
                                    backgroundColor: TranSenColors.primaryGreen,
                                  ),
                                );
                              },
                              icon: const Icon(Icons.construction),
                              label: const Text("VÉRIFICATION BIENTÔT DISPONIBLE"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: TranSenColors.primaryGreen,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 40),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _showEditPhoneDialog(context, ref, userId, phone),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: auth?.role == 'driver' ? Colors.black87 : TranSenColors.primaryGreen,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                        child: const Text('MODIFIER LE NUMÉRO', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
    );
  }

  void _showEditPhoneDialog(BuildContext context, WidgetRef ref, String userId, String currentPhone) {
    final controller = TextEditingController(text: currentPhone == 'Non renseigné' ? '' : currentPhone);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Modifier le numéro'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Nouveau numéro',
            hintText: '77 123 45 67',
            prefixText: '',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('ANNULER'),
          ),
          ElevatedButton(
            onPressed: () async {
              String input = controller.text.trim().replaceAll(' ', '');
              String digitsOnly = input.replaceAll(RegExp(r'\D'), '');
              
              // Normalisation Sénégal
              String finalPhone = digitsOnly;
              if (finalPhone.startsWith('221') && finalPhone.length >= 12) {
                finalPhone = finalPhone.substring(3);
              }

              if (finalPhone.length < 9) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Numéro invalide (min 9 chiffres)")),
                );
                return;
              }

              try {
                await ref.read(userRepositoryProvider).updateUserData({
                  'phone': finalPhone,
                });
                if (context.mounted) Navigator.pop(context);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Numéro mis à jour avec succès !"), backgroundColor: Colors.green),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text("Erreur : ${e.toString()}"), backgroundColor: Colors.red),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: TranSenColors.primaryGreen, foregroundColor: Colors.white),
            child: const Text('ENREGISTRER'),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context, String label, String value, IconData icon, {Widget? trailing}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[900] : Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.grey),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600], fontSize: 12)),
                Text(
                  value, 
                  style: TextStyle(
                    fontWeight: FontWeight.bold, 
                    fontSize: 16,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ],
            ),
          ),
          if (trailing != null) trailing,
        ],
      ),
    );
  }

  void _pickAndUploadAvatar(BuildContext context) async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Galerie'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Appareil photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    final pickedFile = await picker.pickImage(
      source: source,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      try {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  CircularProgressIndicator(color: Colors.white),
                  SizedBox(width: 15),
                  Text("Mise à jour de la photo de profil..."),
                ],
              ),
              duration: Duration(minutes: 1),
              backgroundColor: TranSenColors.primaryGreen,
            ),
          );
        }

        final url = await ref.read(userRepositoryProvider).uploadAvatar(pickedFile.path);

        if (context.mounted) {
          ScaffoldMessenger.of(context).clearSnackBars();
        }

        if (url != null) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text("Photo de profil mise à jour !"), backgroundColor: Colors.green),
            );
          }
          _triggerRefresh();
        } else {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text("Échec de l'upload"), backgroundColor: Colors.red),
            );
          }
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Erreur : ${e.toString()}"), backgroundColor: Colors.red),
          );
        }
      }
    }
  }
}
