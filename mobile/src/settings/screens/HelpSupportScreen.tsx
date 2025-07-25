import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Theme } from '../../styles/theme';

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

interface HelpSupportScreenProps {
  navigation: any;
}

const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [email, setEmail] = useState('');

  const faqCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'rocket-launch',
      questions: [
        {
          q: 'How do I add my motorcycle to RevSync?',
          a: 'Go to your Garage and tap "Add Motorcycle". You can either scan your VIN, search by make/model, or enter details manually. Our AI will help identify your bike and recommend compatible tunes.'
        },
        {
          q: 'What file formats does RevSync support?',
          a: 'RevSync supports ECU files in .bin, .hex, .s19, and .a2l formats. We also support diagnostic files in .dbc and .arxml formats for advanced users.'
        },
        {
          q: 'How does AI tune analysis work?',
          a: 'Our AI analyzes your tune files against a database of over 50,000 tested configurations. It checks for safety parameters, performance potential, and compatibility with your specific motorcycle model.'
        }
      ]
    },
    {
      id: 'safety',
      title: 'Safety & Security',
      icon: 'shield-check',
      questions: [
        {
          q: 'How does RevSync ensure tune safety?',
          a: 'Every tune goes through our T-CLOCS safety analysis system, checking Throttle response, Combustion timing, Lean/rich ratios, Over-rev protection, Compression limits, and System compatibility.'
        },
        {
          q: 'What if a tune damages my motorcycle?',
          a: 'While we analyze tunes for safety, we recommend professional installation. RevSync provides tune safety ratings but cannot guarantee results. Always backup your original ECU file before modifications.'
        },
        {
          q: 'Are my ECU files secure?',
          a: 'Yes. All files are encrypted end-to-end, stored in secure cloud infrastructure, and never shared without your explicit permission. You can delete your data at any time.'
        }
      ]
    },
    {
      id: 'marketplace',
      title: 'Marketplace & Purchases',
      icon: 'store',
      questions: [
        {
          q: 'How do I purchase a tune?',
          a: 'Browse the marketplace, select a tune compatible with your bike, review the safety analysis, and purchase securely. Tunes are delivered instantly to your garage after payment.'
        },
        {
          q: 'Can I get a refund if a tune doesn\'t work?',
          a: 'We offer a 30-day satisfaction guarantee. If a tune doesn\'t perform as expected, contact support with details and we\'ll work with the creator to resolve issues or provide a refund.'
        },
        {
          q: 'How do I become a verified tuner?',
          a: 'Apply through our Creator Program. You\'ll need to demonstrate expertise, provide certifications, and pass our safety assessment. Verified tuners earn higher revenue shares and priority placement.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Issues',
      icon: 'wrench',
      questions: [
        {
          q: 'The app crashes when uploading files',
          a: 'This usually happens with very large files. Try compressing your file or uploading via WiFi. If issues persist, contact support with your device model and file details.'
        },
        {
          q: 'My motorcycle model isn\'t listed',
          a: 'You can add custom motorcycle details or request model addition. Our team regularly updates the database based on user requests and market availability.'
        },
        {
          q: 'Sync issues between devices',
          a: 'Ensure you\'re signed into the same account on all devices. Force-close and reopen the app, or try signing out and back in to refresh sync.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Billing',
      icon: 'account-circle',
      questions: [
        {
          q: 'How do I change my subscription?',
          a: 'Go to Settings > Account > Subscription. You can upgrade, downgrade, or cancel anytime. Changes take effect at your next billing cycle.'
        },
        {
          q: 'I forgot my password',
          a: 'Use "Forgot Password" on the login screen. We\'ll send a reset link to your registered email. For security, links expire after 1 hour.'
        },
        {
          q: 'How do I delete my account?',
          a: 'Go to Settings > Account > Delete Account. This permanently removes all your data, purchases, and content. This action cannot be undone.'
        }
      ]
    }
  ];

  const supportOptions = [
    {
      id: 'chat',
      title: 'Live Chat Support',
      description: 'Get instant help from our support team',
      icon: 'chat',
      availability: '24/7',
      action: () => handleLiveChat()
    },
    {
      id: 'email',
      title: 'Email Support',
      description: 'Send us a detailed message',
      icon: 'email',
      availability: 'Response within 4 hours',
      action: () => handleEmailSupport()
    },
    {
      id: 'community',
      title: 'Community Forum',
      description: 'Ask the RevSync community',
      icon: 'forum',
      availability: 'Always active',
      action: () => handleCommunityForum()
    },
    {
      id: 'phone',
      title: 'Phone Support',
      description: 'Speak with a technical expert',
      icon: 'phone',
      availability: 'Mon-Fri 9AM-6PM PST',
      action: () => handlePhoneSupport()
    }
  ];

  const handleLiveChat = () => {
    // In a real app, this would open a chat widget
    Alert.alert(
      'Live Chat',
      'Opening live chat support...\n\nChat will be available in the next app update. For now, please use email support at support@revsync.com',
      [{ text: 'OK' }]
    );
  };

  const handleEmailSupport = () => {
    const subject = 'RevSync Support Request';
    const body = `Device: ${Platform.OS}\nApp Version: 1.2.3\n\nDescription:\n`;
    const url = `mailto:support@revsync.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open email client. Please email us at support@revsync.com');
    });
  };

  const handleCommunityForum = () => {
    Linking.openURL('https://community.revsync.com').catch(() => {
      Alert.alert('Error', 'Could not open community forum');
    });
  };

  const handlePhoneSupport = () => {
    Alert.alert(
      'Phone Support',
      'Call us at:\n+1 (555) 123-TUNE\n\nAvailable Monday-Friday\n9:00 AM - 6:00 PM PST',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => Linking.openURL('tel:+15551238863') }
      ]
    );
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // In a real app, this would send to your feedback API
    Alert.alert(
      'Feedback Submitted',
      'Thank you for your feedback! We\'ll review it and get back to you within 24 hours.',
      [{ text: 'OK', onPress: () => {
        setFeedbackText('');
        setEmail('');
      }}]
    );
  };

  const renderFAQCategory = (category: any) => (
    <View key={category.id} style={styles.categoryCard}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => setSelectedCategory(
          selectedCategory === category.id ? null : category.id
        )}
      >
        <View style={styles.categoryLeft}>
          <View style={styles.categoryIcon}>
            <TypedIcon 
              name={category.icon} 
              size={24} 
              color={Theme.colors.accent.primary} 
            />
          </View>
          <Text style={styles.categoryTitle}>{category.title}</Text>
        </View>
        <TypedIcon
          name={selectedCategory === category.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Theme.colors.content.secondary}
        />
      </TouchableOpacity>

      {selectedCategory === category.id && (
        <View style={styles.questionsContainer}>
          {category.questions.map((item: any, index: number) => (
            <View key={index} style={styles.questionItem}>
              <Text style={styles.question}>{item.q}</Text>
              <Text style={styles.answer}>{item.a}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderSupportOption = (option: any) => (
    <TouchableOpacity
      key={option.id}
      style={styles.supportOption}
      onPress={option.action}
    >
      <View style={styles.supportIcon}>
        <TypedIcon 
          name={option.icon} 
          size={24} 
          color={Theme.colors.accent.primary} 
        />
      </View>
      <View style={styles.supportContent}>
        <Text style={styles.supportTitle}>{option.title}</Text>
        <Text style={styles.supportDescription}>{option.description}</Text>
        <Text style={styles.supportAvailability}>{option.availability}</Text>
      </View>
      <TypedIcon
        name="chevron-right"
        size={20}
        color={Theme.colors.content.tertiary}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <TypedIcon name="arrow-left" size={24} color={Theme.colors.content.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help Now</Text>
          <View style={styles.sectionCard}>
            {supportOptions.map(renderSupportOption)}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqCategories.map(renderFAQCategory)}
        </View>

        {/* Feedback Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Feedback</Text>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>Help us improve RevSync</Text>
            <Text style={styles.feedbackDescription}>
              Your feedback helps us build better features and fix issues.
            </Text>
            
            <TextInput
              style={styles.emailInput}
              placeholder="Your email address"
              placeholderTextColor={Theme.colors.content.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.feedbackInput}
              placeholder="Share your thoughts, report bugs, or suggest features..."
              placeholderTextColor={Theme.colors.content.tertiary}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitFeedback}
            >
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Other Ways to Reach Us</Text>
          <Text style={styles.contactItem}>📧 support@revsync.com</Text>
          <Text style={styles.contactItem}>📞 +1 (555) 123-TUNE</Text>
          <Text style={styles.contactItem}>🌐 community.revsync.com</Text>
          <Text style={styles.contactItem}>📍 123 Innovation Drive, San Francisco, CA</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.content.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.content.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.content.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.content.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.content.primary,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  sectionCard: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.content.divider,
  },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${Theme.colors.accent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.content.primary,
    marginBottom: 2,
  },
  supportDescription: {
    fontSize: 14,
    color: Theme.colors.content.secondary,
    marginBottom: 2,
  },
  supportAvailability: {
    fontSize: 12,
    color: Theme.colors.accent.primary,
    fontWeight: '500',
  },
  categoryCard: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${Theme.colors.accent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.content.primary,
  },
  questionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  questionItem: {
    marginBottom: 16,
    paddingLeft: 52, // Align with icon
  },
  question: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.content.primary,
    marginBottom: 6,
  },
  answer: {
    fontSize: 14,
    color: Theme.colors.content.secondary,
    lineHeight: 20,
  },
  feedbackCard: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.content.primary,
    marginBottom: 4,
  },
  feedbackDescription: {
    fontSize: 14,
    color: Theme.colors.content.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  emailInput: {
    backgroundColor: Theme.colors.content.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.colors.content.primary,
    borderWidth: 1,
    borderColor: Theme.colors.content.border,
    marginBottom: 12,
  },
  feedbackInput: {
    backgroundColor: Theme.colors.content.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.colors.content.primary,
    borderWidth: 1,
    borderColor: Theme.colors.content.border,
    minHeight: 100,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: Theme.colors.accent.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactInfo: {
    backgroundColor: `${Theme.colors.accent.primary}10`,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.content.primary,
    marginBottom: 12,
  },
  contactItem: {
    fontSize: 14,
    color: Theme.colors.content.secondary,
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default HelpSupportScreen; 