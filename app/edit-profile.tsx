import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, Image, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';


const EditProfile = () => {
    const router = useRouter();
    const { user } = useUser();
    const { signOut } = useAuth();
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [username, setUserName] = useState(user?.username || '');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const handleSave = async () => {
        setLoading(true);

        try {
            user?.reload()
            const response = user?.update({ firstName: firstName, lastName: lastName , username: username})
            console.log("response : ", response)
            user?.reload()
            console.log(user?.fullName)
            Alert.alert('Profile updated!');
        } catch (err: any) {
            Alert.alert('Error here ', err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordLoading(true);
        setPasswordError('');
        setPasswordSuccess('');
        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters.');
            setPasswordLoading(false);
            return;
        }
        try {
            await user?.updatePassword({ currentPassword, newPassword });
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setPasswordSuccess('Password changed successfully!');
            Alert.alert('Password Changed', 'Your password has been updated.');
        } catch (err: any) {
            setPasswordError(err.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await user?.delete();
                            await signOut();
                            router.replace('/login');
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to delete account');
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    //   const handlePickImage = async () => {
    //     const result = await ImagePicker.launchImageLibraryAsync({
    //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //       allowsEditing: true,
    //       aspect: [1, 1],
    //       quality: 0.7,
    //     });
    //     if (!result.canceled && result.assets && result.assets.length > 0) {
    //       setImageUploading(true);
    //       try {
    //         const uri = result.assets[0].uri;
    //         const response = await fetch(uri);
    //         const blob = await response.blob();
    //         console.log(blob)
    //         await user?.setProfileImage({ file: blob });
    //         Alert.alert('Profile Image Updated!');
    //       } catch (err: any) {
    //         Alert.alert('Error', err.message || 'Failed to update profile image');
    //       } finally {
    //         setImageUploading(false);
    //       }
    //     }
    //   };

    console.log("password enabled: ", user?.passwordEnabled);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets.length > 0) {
            setImageUploading(true);

            try {
                const uri = result.assets[0].uri;

                // Get Blob from local file URI
                const response = await fetch(uri);
                let blob = await response.blob();
                blob = blob.slice(0, blob.size, 'image/jpeg');

                // Create new Blob with correct type (fixes Clerk error)
                blob = blob.slice(0, blob.size, 'image/jpeg'); // or 'image/png'

                // Upload using Clerk's method
                await user?.setProfileImage({ file: blob });

                Alert.alert('Profile Image Updated!');
            } catch (err: any) {
                Alert.alert('Error in update ', err.message || 'Failed to update profile image');
            } finally {
                setImageUploading(false);
            }
        }
    };

    const handleOpenPasswordModal = () => {
        if (!user?.passwordEnabled) {
            Alert.alert(
                'Password Change Not Available',
                'You signed in with Google, Apple, or another provider. To change your password, please use a password-enabled account.'
            );
            return;
        }
        setShowPasswordModal(true);
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={26} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
            </LinearGradient>
            <View style={styles.card}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={handlePickImage} disabled={imageUploading}>
                        {user?.imageUrl ? (
                            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={40} color="#FF6B6B" />
                            </View>
                        )}
                        <View style={styles.editIconCircle}>
                            {imageUploading ? (
                                <ActivityIndicator color="#FF6B6B" size={18} />
                            ) : (
                                <Ionicons name="camera" size={18} color="#FF6B6B" />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.form}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First Name"
                    />
                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Last Name"
                    />

                    <Text style={styles.label}>User Name</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUserName}
                        placeholder="User Name"
                    />



                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.passwordButton}
                        onPress={handleOpenPasswordModal}
                    >
                        <Text style={styles.passwordButtonText}>Change Password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeleteAccount}
                        disabled={deleting}
                    >
                        <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete Account'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Modal visible={showPasswordModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentCard}>
                        <Ionicons name="lock-closed-outline" size={36} color="#FF6B6B" style={{ marginBottom: 8 }} />
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <Text style={styles.passwordRequirements}>
                            Password must be at least 8 characters.
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.inputField}
                                placeholder="Current Password"
                                secureTextEntry={!showCurrentPassword}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                autoCapitalize="none"
                                placeholderTextColor="#bbb"
                            />
                            <TouchableOpacity
                                style={styles.inputIcon}
                                onPress={() => setShowCurrentPassword((v) => !v)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.inputField}
                                placeholder="New Password"
                                secureTextEntry={!showNewPassword}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                autoCapitalize="none"
                                placeholderTextColor="#bbb"
                            />
                            <TouchableOpacity
                                style={styles.inputIcon}
                                onPress={() => setShowNewPassword((v) => !v)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                        {passwordSuccess ? <Text style={styles.successText}>{passwordSuccess}</Text> : null}
                        <TouchableOpacity
                            style={styles.modalSaveButton}
                            onPress={handleChangePassword}
                            disabled={passwordLoading}
                        >
                            <Text style={styles.modalSaveButtonText}>{passwordLoading ? 'Saving...' : 'Change Password'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowPasswordModal(false)}>
                            <Text style={styles.modalCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 30,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        alignItems: 'center',
        flexDirection: 'row',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: Platform.OS === 'ios' ? 60 : 30,
        zIndex: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        padding: 6,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginTop: -10,
        marginHorizontal: 18,
        paddingVertical: 28,
        paddingHorizontal: 18,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 18,
        alignItems: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 10,
    },

    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: '#FF6B6B',
    },
    avatarPlaceholder: {
        backgroundColor: '#FFF0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconCircle: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#FF6B6B',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 2,
    },
    form: { width: '100%', marginTop: 10 },
    label: { fontSize: 16, color: '#333', marginBottom: 6, marginTop: 16 },
    input: {
        borderWidth: 1,
        borderColor: '#FF6B6B55',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FFF8F8',
        color: '#333',
        marginBottom: 2,
    },
    email: {
        fontSize: 16,
        color: '#666',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    saveButton: {
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 30,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    passwordButton: {
        backgroundColor: '#FFF0F0',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 18,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    passwordButtonText: {
        color: '#FF6B6B',
        fontWeight: '700',
        fontSize: 16,
    },
    deleteButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 18,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    deleteButtonText: {
        color: '#FF6B6B',
        fontWeight: '700',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContentCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        width: '90%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
    },
    inputWrapper: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8F8',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF6B6B55',
        marginBottom: 16,
        paddingRight: 8,
    },
    inputField: {
        flex: 1,
        padding: 14,
        fontSize: 16,
        color: '#333',
        backgroundColor: 'transparent',
        borderRadius: 12,
    },
    inputIcon: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSaveButton: {
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
        marginBottom: 6,
    },
    modalSaveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    modalCancelButton: {
        backgroundColor: '#FFF0F0',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        width: '100%',
        marginTop: 0,
    },
    modalCancelButtonText: {
        color: '#FF6B6B',
        fontWeight: '700',
        fontSize: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FF6B6B',
        marginBottom: 18,
    },
    passwordRequirements: {
        color: '#666',
        fontSize: 13,
        marginBottom: 10,
        textAlign: 'center',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginTop: 4,
        marginBottom: 2,
        textAlign: 'center',
    },
    successText: {
        color: '#4ECDC4',
        fontSize: 14,
        marginTop: 4,
        marginBottom: 2,
        textAlign: 'center',
    },
});

export default EditProfile; 