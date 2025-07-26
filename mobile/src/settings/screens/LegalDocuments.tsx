import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Theme } from '../../styles/theme';

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

interface LegalDocumentProps {
  navigation: any;
  route: {
    params: {
      type: 'terms' | 'privacy' | 'eula';
    };
  };
}

const LegalDocuments: React.FC<LegalDocumentProps> = ({ navigation, route }) => {
  const { type } = route.params;

  const getTitle = () => {
    switch (type) {
      case 'terms':
        return 'Terms & Conditions';
      case 'privacy':
        return 'Privacy Policy';
      case 'eula':
        return 'End-User License Agreement';
      default:
        return 'Legal Document';
    }
  };

  const getContent = () => {
    switch (type) {
      case 'terms':
        return TERMS_CONTENT;
      case 'privacy':
        return PRIVACY_CONTENT;
      case 'eula':
        return EULA_CONTENT;
      default:
        return '';
    }
  };

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
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.documentContent}>{getContent()}</Text>
        
        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Last updated: January 15, 2025
          </Text>
          <Text style={styles.versionText}>
            Document version: 2025.1
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Terms & Conditions Content
const TERMS_CONTENT = `TERMS AND CONDITIONS OF USE

Last Updated: January 15, 2025
Version: 2025.1

Welcome to [Your App Name], an AI-powered motorcycle tuning marketplace and platform. These Terms and Conditions ("Terms", "Agreement") constitute a legally binding agreement between you ("User", "you", "your") and [Your Company Name] ("[Your App Name]", "we", "us", "our") governing your access to and use of the [Your App Name] mobile application, website, and related services (collectively, the "Service").

BY ACCESSING OR USING OUR SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND ALL APPLICABLE LAWS AND REGULATIONS. IF YOU DO NOT AGREE WITH ANY PART OF THESE TERMS, YOU MUST NOT USE OUR SERVICE.

══════════════════════════════════════════════════════

1. ACCEPTANCE AND MODIFICATION OF TERMS

1.1 Agreement to Terms
By creating an account, downloading our mobile application, or accessing any part of our Service, you expressly agree to these Terms and our Privacy Policy, which is incorporated herein by reference.

1.2 Age Requirements
You must be at least 18 years of age to use [Your App Name]. By using our Service, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into this Agreement.

1.3 Modifications to Terms
We reserve the right to modify these Terms at any time. We will notify users of material changes via email or in-app notification at least 30 days before the changes take effect. Your continued use of the Service after changes become effective constitutes acceptance of the modified Terms.

1.4 Additional Terms
Certain features or services may be subject to additional terms and conditions, which will be presented to you at the time of access to such features or services.

══════════════════════════════════════════════════════

2. DESCRIPTION OF SERVICE

2.1 Platform Overview
[Your App Name] is a comprehensive motorcycle tuning ecosystem that provides:

• AI-powered ECU tune analysis and recommendations
• Marketplace for verified motorcycle performance tunes
• Community platform for tuners, riders, and motorcycle enthusiasts
• Safety validation and risk assessment tools
• Compatibility checking for motorcycle modifications
• Professional tuner certification and verification services
• Educational resources and training materials

2.2 AI-Powered Recommendations
Our artificial intelligence system analyzes multiple data points including:
• Motorcycle specifications and compatibility data
• User riding patterns and preferences
• Environmental factors and regional regulations
• Safety parameters and industry standards
• Community feedback and performance metrics

2.3 Marketplace Services
[Your App Name] facilitates transactions between tune creators and users, providing:
• Secure payment processing
• Digital delivery of tune files
• Version control and update management
• Customer support and dispute resolution
• Quality assurance and safety verification

══════════════════════════════════════════════════════

3. USER RESPONSIBILITIES AND CONDUCT

3.1 Account Registration
You must provide accurate, current, and complete information during registration and maintain the accuracy of such information. You are responsible for safeguarding your account credentials and for all activities under your account.

3.2 Motorcycle Safety and Legal Compliance
You acknowledge and agree that:

• Motorcycle tuning and performance modifications carry inherent risks
• You are solely responsible for the safe implementation and use of any tunes
• You must comply with all applicable federal, state, and local laws
• Vehicle modifications may affect insurance coverage and warranties
• Street use of racing tunes may be illegal in your jurisdiction
• You will only use tunes in appropriate environments (track, off-road, etc.)

3.3 Professional Consultation
You acknowledge that:
• [Your App Name] recommendations are for informational purposes only
• You should consult qualified mechanics before implementing modifications
• Professional installation may be required for certain tunes
• You assume all risks associated with tune implementation

3.4 Prohibited Uses
You agree not to:

• Upload malicious, corrupted, or harmful tune files
• Reverse engineer, decompile, or attempt to extract source code
• Use automated systems to access or interact with our Service
• Violate any applicable laws or regulations
• Infringe upon intellectual property rights of others
• Engage in harassment, abuse, or inappropriate conduct
• Attempt to gain unauthorized access to other user accounts
• Distribute copyrighted or proprietary tune files without permission

══════════════════════════════════════════════════════

4. SAFETY DISCLAIMERS AND RISK ASSUMPTION

4.1 Inherent Risks
Motorcycle tuning involves significant risks including but not limited to:
• Engine damage or failure
• Reduced vehicle reliability
• Increased accident risk due to performance changes
• Voiding of manufacturer warranties
• Legal liability for emissions or noise violations
• Personal injury or death

4.2 No Safety Guarantees
[Your App Name] DOES NOT GUARANTEE THE SAFETY, RELIABILITY, OR PERFORMANCE OF ANY TUNES OR MODIFICATIONS. ALL RECOMMENDATIONS ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.

4.3 Professional Supervision
We strongly recommend that all tune installations be performed by or under the supervision of qualified motorcycle technicians or certified professionals.

4.4 Environmental Responsibility
Users must ensure that any modifications comply with emissions standards and environmental regulations in their jurisdiction.

══════════════════════════════════════════════════════

5. INTELLECTUAL PROPERTY RIGHTS

5.1 [Your App Name] Property
All content, features, and functionality of the Service, including but not limited to software, algorithms, AI models, text, graphics, logos, images, and audio, are owned by [Your Company Name] and protected by copyright, trademark, patent, and other intellectual property laws.

5.2 User-Generated Content
When you upload, share, or submit tune files, comments, reviews, or other content:

• You retain ownership of your original intellectual property
• You grant [Your Company Name] a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content
• You represent that you have the right to grant such license
• You agree that your content does not infringe third-party rights

5.3 Community Contributions
Contributions to our open-source community are subject to additional licensing terms that will be presented at the time of contribution.

5.4 Trademark Usage
[Your App Name], the [Your App Name] logo, and other [Your App Name] trademarks may not be used without our express written permission.

══════════════════════════════════════════════════════

6. PAYMENT TERMS AND REFUNDS

6.1 Pricing and Payment
• All prices are displayed in USD unless otherwise noted
• Payment is due immediately upon purchase
• We accept major credit cards, PayPal, and other approved payment methods
• Subscription fees are billed in advance on a recurring basis

6.2 Refund Policy
• Digital tune purchases are generally non-refundable due to their nature
• Refunds may be provided for defective products or billing errors
• Subscription refunds are prorated for unused periods
• All refund requests must be submitted within 30 days of purchase

6.3 Taxes
You are responsible for all applicable taxes, duties, and government fees related to your use of the Service.

══════════════════════════════════════════════════════

7. PRIVACY AND DATA PROTECTION

7.1 Data Collection
We collect and process personal and technical data as described in our Privacy Policy, including:
• Account and profile information
• Vehicle specifications and performance data
• Usage patterns and preferences
• Location data (with consent)
• Communications and feedback

7.2 Data Security
We implement industry-standard security measures to protect your data, but cannot guarantee absolute security. You acknowledge the inherent risks of internet transmission.

7.3 International Transfers
Your data may be processed and stored in countries other than your residence. We ensure appropriate safeguards are in place for international transfers.

══════════════════════════════════════════════════════

8. AI AND ALGORITHMIC SERVICES

8.1 AI Limitations
Our AI recommendations are based on:
• Historical data and statistical analysis
• Machine learning models trained on available datasets
• Community feedback and performance metrics
• Industry standards and safety guidelines

8.2 No Guarantees
AI recommendations are probabilistic and may not be suitable for all situations. We do not guarantee:
• Accuracy of all recommendations
• Compatibility with all motorcycle configurations
• Optimal performance outcomes
• Safety in all use cases

8.3 Continuous Improvement
Our AI systems are continuously updated and improved. Recommendations may change as our models evolve and new data becomes available.

══════════════════════════════════════════════════════

9. LIMITATION OF LIABILITY

9.1 Disclaimer of Warranties
TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

9.2 Limitation of Damages
IN NO EVENT SHALL [Your App Name] BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.

9.3 Maximum Liability
OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS RELATING TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM.

9.4 Force Majeure
We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including natural disasters, government actions, or technical failures.

══════════════════════════════════════════════════════

10. INDEMNIFICATION

You agree to defend, indemnify, and hold harmless [Your App Name] and its officers, directors, employees, and agents from any claims, damages, obligations, losses, liabilities, costs, and expenses arising from:

• Your use of the Service
• Your violation of these Terms
• Your infringement of third-party rights
• Any damage or injury resulting from tune implementation
• Your violation of applicable laws or regulations

══════════════════════════════════════════════════════

11. TERMINATION

11.1 Termination by You
You may terminate your account at any time by contacting customer support or using account deletion features in the app.

11.2 Termination by Us
We may suspend or terminate your account immediately if you:
• Violate these Terms or our policies
• Engage in fraudulent or illegal activities
• Pose a safety risk to the community
• Fail to pay applicable fees

11.3 Effect of Termination
Upon termination:
• Your access to the Service will cease
• Your account data may be deleted after a reasonable retention period
• Certain provisions of these Terms will survive termination

══════════════════════════════════════════════════════

12. DISPUTE RESOLUTION

12.1 Informal Resolution
Before filing any formal dispute, you agree to contact us at legal@yourcompany.com to seek informal resolution.

12.2 Binding Arbitration
Any disputes not resolved informally shall be resolved through binding arbitration in accordance with the Commercial Arbitration Rules of the American Arbitration Association.

12.3 Class Action Waiver
You agree to resolve disputes individually and waive any right to participate in class action lawsuits or class-wide arbitration.

12.4 Governing Law
These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.

══════════════════════════════════════════════════════

13. REGULATORY COMPLIANCE

13.1 Emissions Compliance
Users must ensure that any modifications comply with applicable emissions standards and environmental regulations, including but not limited to EPA and CARB requirements.

13.2 International Regulations
Users outside the United States must comply with local regulations regarding vehicle modifications and emissions standards.

13.3 Racing Use Only
Certain tunes may be designated for racing or off-road use only and must not be used on public roads where prohibited.

══════════════════════════════════════════════════════

14. MISCELLANEOUS

14.1 Entire Agreement
These Terms constitute the entire agreement between you and [Your App Name] regarding the Service and supersede all prior agreements.

14.2 Severability
If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.

14.3 Assignment
You may not assign these Terms without our consent. We may assign these Terms to any affiliate or successor.

14.4 Contact Information
For questions about these Terms, please contact us at:

Email: legal@yourcompany.com
Phone: +1 (555) 123-XXXX
Address: [Company Name]
        Legal Department
        [Address Line 1]
        [City], [State] [ZIP]
        [Country]

Web: https://yourcompany.com/legal
Support: https://support.yourcompany.com

══════════════════════════════════════════════════════

© 2025 [Your Company Name]. All rights reserved.`;

// Privacy Policy Content
const PRIVACY_CONTENT = `PRIVACY POLICY

Last Updated: January 15, 2025
Version: 2025.1
Effective Date: January 15, 2025

[Your Company Name] ("[Your App Name]", "we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application, website, and related services (collectively, the "Service").

This Privacy Policy is designed to comply with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other applicable privacy laws.

BY USING OUR SERVICE, YOU CONSENT TO THE COLLECTION AND USE OF INFORMATION IN ACCORDANCE WITH THIS POLICY.

══════════════════════════════════════════════════════

1. INFORMATION WE COLLECT

1.1 Personal Information You Provide
We collect information you voluntarily provide, including:

Account Information:
• Name, email address, username, and password
• Profile photo and biographical information
• Phone number (optional)
• Date of birth (for age verification)
• Payment information (processed securely through third-party providers)

Motorcycle Information:
• Make, model, year, and specifications of your motorcycles
• VIN numbers (encrypted and stored securely)
• Modification history and performance data
• ECU software versions and compatibility information

Content and Communications:
• Tune files and modifications you upload or share
• Reviews, comments, and forum posts
• Messages and communications with other users
• Customer support interactions and feedback

1.2 Information Automatically Collected
We automatically collect certain information when you use our Service:

Technical Information:
• Device type, operating system, and app version
• IP address and approximate geographic location
• Usage patterns, feature utilization, and session duration
• Crash reports and error logs (anonymized)
• Network connectivity and performance metrics

Motorcycle Performance Data:
• ECU data and diagnostic information (with consent)
• Performance metrics and telemetry (when available)
• Fuel consumption and efficiency data
• Emission levels and environmental impact data

Analytics Information:
• Page views, clicks, and navigation patterns
• Search queries and filter preferences
• Download and purchase history
• Social sharing and community engagement metrics

1.3 Information from Third Parties
We may receive information from:

• Motorcycle manufacturers and dealerships (with consent)
• OBD-II diagnostic systems and connected devices
• Social media platforms (when you connect accounts)
• Payment processors and financial institutions
• Marketing partners and analytics providers

══════════════════════════════════════════════════════

2. HOW WE USE YOUR INFORMATION

2.1 Service Provision and Improvement
We use your information to:

• Provide, operate, and maintain our Service
• Process transactions and deliver purchased content
• Verify motorcycle compatibility and safety
• Generate personalized AI recommendations
• Provide customer support and technical assistance
• Improve our algorithms and user experience

2.2 Safety and Security
We use your information to:

• Verify the safety and compatibility of tune files
• Detect and prevent fraudulent or malicious activity
• Enforce our Terms of Service and community guidelines
• Protect against security threats and unauthorized access
• Comply with legal requirements and industry standards

2.3 Communication and Marketing
With your consent, we may use your information to:

• Send service updates and important notifications
• Provide customer support and respond to inquiries
• Send promotional content and product recommendations
• Notify you about new features and community events
• Conduct surveys and gather feedback

2.4 Research and Development
We may use aggregated, anonymized data for:

• Developing new features and services
• Conducting safety research and analysis
• Improving AI algorithms and recommendations
• Publishing industry reports and insights
• Advancing motorcycle safety and performance standards

══════════════════════════════════════════════════════

3. HOW WE SHARE YOUR INFORMATION

3.1 With Your Consent
We share information when you explicitly consent, such as:

• Connecting with other users in the community
• Sharing tune files and modifications publicly
• Participating in collaborative projects
• Integrating with third-party services

3.2 Service Providers
We share information with trusted service providers who assist us in:

• Cloud hosting and data storage
• Payment processing and billing
• Customer support and communication
• Analytics and performance monitoring
• Security services and fraud prevention

3.3 Business Transfers
In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction, subject to appropriate privacy protections.

3.4 Legal Requirements
We may disclose information when required by law or to:

• Comply with legal processes and government requests
• Enforce our Terms of Service and policies
• Protect our rights, property, and safety
• Protect the rights and safety of our users and the public
• Investigate and prevent illegal activities

3.5 Aggregated and Anonymized Data
We may share aggregated, anonymized data that cannot identify individual users for:

• Industry research and reporting
• Safety studies and analysis
• Product development and improvement
• Marketing and business purposes

══════════════════════════════════════════════════════

4. DATA SECURITY AND PROTECTION

4.1 Security Measures
We implement comprehensive security measures including:

• End-to-end encryption for sensitive data
• Secure Socket Layer (SSL) technology for data transmission
• Multi-factor authentication and access controls
• Regular security audits and penetration testing
• Employee training and background checks

4.2 Data Storage and Retention
• Data is stored on secure servers with restricted access
• We retain personal information only as long as necessary
• Account data is deleted within 30 days of account closure
• Aggregated analytics data may be retained indefinitely
• Backup data is securely stored and regularly tested

4.3 Incident Response
In the event of a data breach:

• We will notify affected users within 72 hours
• Law enforcement and regulatory authorities will be contacted as required
• We will provide details about the incident and remediation steps
• Credit monitoring services may be offered if financial data is involved

══════════════════════════════════════════════════════

5. YOUR PRIVACY RIGHTS

5.1 Access and Portability
You have the right to:

• Access your personal information
• Download a copy of your data
• Request information about our data practices
• Receive data in a portable format

5.2 Correction and Deletion
You have the right to:

• Correct inaccurate personal information
• Update your account and profile details
• Delete your account and associated data
• Request removal of specific content or posts

5.3 Consent and Opt-Out
You have the right to:

• Withdraw consent for data processing
• Opt out of marketing communications
• Disable location tracking and analytics
• Control cookie preferences and tracking

5.4 GDPR Rights (EU Residents)
If you are in the European Union, you have additional rights under GDPR:

• Right to object to processing
• Right to restrict processing
• Right to data portability
• Right to lodge a complaint with supervisory authorities

5.5 CCPA Rights (California Residents)
If you are a California resident, you have rights under CCPA:

• Right to know what personal information is collected
• Right to delete personal information
• Right to opt-out of the sale of personal information
• Right to non-discrimination for exercising privacy rights

══════════════════════════════════════════════════════

6. COOKIES AND TRACKING TECHNOLOGIES

6.1 Types of Cookies We Use
• Essential cookies for basic functionality
• Performance cookies for analytics and optimization
• Functional cookies for enhanced user experience
• Marketing cookies for personalized advertising (with consent)

6.2 Third-Party Tracking
We may use third-party services for:

• Google Analytics for usage analytics
• Crashlytics for error reporting
• Social media plugins and widgets
• Advertising networks and retargeting

6.3 Cookie Management
You can control cookies through:

• Browser settings and preferences
• In-app privacy controls
• Third-party opt-out tools
• Industry-standard opt-out mechanisms

══════════════════════════════════════════════════════

7. INTERNATIONAL DATA TRANSFERS

7.1 Global Operations
[Your App Name] operates globally and may transfer data to countries outside your residence, including the United States.

7.2 Transfer Safeguards
For international transfers, we ensure:

• Adequate protection through appropriate safeguards
• Standard Contractual Clauses (SCCs) where applicable
• Privacy Shield certification for US transfers (where applicable)
• Regular assessment of transfer mechanisms

7.3 Country-Specific Protections
We implement additional protections for transfers to countries without adequate privacy laws, including enhanced contractual safeguards and technical measures.

══════════════════════════════════════════════════════

8. CHILDREN'S PRIVACY

8.1 Age Restrictions
Our Service is not intended for children under 18. We do not knowingly collect personal information from children under 18.

8.2 Parental Rights
If we become aware that we have collected information from a child under 18:

• We will delete the information immediately
• We will not use the information for any purpose
• Parents may contact us to request deletion of their child's information

══════════════════════════════════════════════════════

9. CHANGES TO THIS PRIVACY POLICY

9.1 Policy Updates
We may update this Privacy Policy periodically to reflect:

• Changes in our data practices
• New features and services
• Legal and regulatory requirements
• Industry best practices

9.2 Notification of Changes
We will notify you of material changes through:

• Email notification to your registered address
• In-app notifications and announcements
• Prominent notices on our website
• Updated version numbers and effective dates

9.3 Continued Use
Your continued use of the Service after changes become effective constitutes acceptance of the updated Privacy Policy.

══════════════════════════════════════════════════════

10. CONTACT INFORMATION

10.1 Privacy Inquiries
For privacy-related questions, requests, or concerns, contact us at:

Email: privacy@yourcompany.com
Phone: +1 (555) 123-PRIV
Mail: Privacy Officer
      [Your Company Name]
      1234 Innovation Drive, Suite 567
      San Francisco, CA 94105
      United States

10.2 Data Protection Officer
For GDPR-related inquiries:

Email: dpo@yourcompany.com
Phone: +1 (555) 123-GDPR

10.3 Response Time
We will respond to privacy requests within:

• 30 days for general inquiries
• 72 hours for urgent security matters
• As required by applicable law for rights requests

══════════════════════════════════════════════════════

© 2025 [Your Company Name]. All rights reserved.`;

// EULA Content
const EULA_CONTENT = `END-USER LICENSE AGREEMENT (EULA)

Last Updated: January 15, 2025
Version: 2025.1
License Type: Commercial Software License

This End-User License Agreement ("EULA", "Agreement") is a legal agreement between you ("Licensee", "you", "your") and [Your Company Name] ("Licensor", "[Your App Name]", "we", "us", "our") for the [Your App Name] mobile application, including any associated software, artificial intelligence algorithms, databases, and related documentation (collectively, the "Software").

BY INSTALLING, ACCESSING, OR USING THE SOFTWARE, YOU ACKNOWLEDGE THAT YOU HAVE READ THIS EULA, UNDERSTAND IT, AND AGREE TO BE BOUND BY ITS TERMS AND CONDITIONS.

══════════════════════════════════════════════════════

1. GRANT OF LICENSE

1.1 License Grant
Subject to the terms and conditions of this EULA, [Your App Name] grants you a limited, non-exclusive, non-transferable, revocable license to:

• Install and use the Software on your personal mobile devices
• Access and use the features and functionality provided by the Software
• Download, store, and use tune files and related content through the Software
• Participate in the [Your App Name] community and marketplace

1.2 License Scope
This license is granted solely for your personal, non-commercial use unless you have entered into a separate commercial agreement with [Your Company Name].

1.3 Multi-Device Usage
You may install the Software on multiple devices that you own or control, provided that you do not exceed reasonable usage limits or share your account credentials.

1.4 Subscription Services
Certain features require an active subscription. Your access to subscription features is contingent upon payment of applicable fees and compliance with subscription terms.

══════════════════════════════════════════════════════

2. INTELLECTUAL PROPERTY RIGHTS

2.1 Ownership of Software
The Software, including all copyrights, patents, trademarks, trade secrets, and other intellectual property rights, is and remains the exclusive property of [Your Company Name] and its licensors.

2.2 AI Algorithms and Models
The artificial intelligence algorithms, machine learning models, and related technologies incorporated in the Software are proprietary to [Your Company Name] and protected by intellectual property laws and trade secrets.

2.3 User-Generated Content
While you retain ownership of tune files and content you create or upload:

• You grant [Your Company Name] a license to use, store, and distribute your content through the Software
• You represent that you have the right to grant such license
• [Your Company Name] may use aggregated, anonymized data derived from your content for improving the Software

2.4 Third-Party Components
The Software may include third-party open source components, which are governed by their respective licenses. A complete list of third-party components and their licenses is available in the Software documentation.

══════════════════════════════════════════════════════

3. RESTRICTIONS AND LIMITATIONS

3.1 Prohibited Activities
You may NOT:

• Reverse engineer, decompile, disassemble, or attempt to derive source code
• Modify, adapt, translate, or create derivative works based on the Software
• Remove, alter, or obscure any copyright, trademark, or other proprietary notices
• Use the Software for any illegal, harmful, or unauthorized purposes
• Attempt to gain unauthorized access to [Your App Name] systems or other users' accounts
• Use automated scripts, bots, or other automated means to access the Software
• Distribute, sublicense, lease, rent, or loan the Software to third parties
• Use the Software in a manner that violates any applicable laws or regulations

3.2 AI and Algorithm Restrictions
You specifically may NOT:

• Attempt to reverse engineer or extract our AI models or algorithms
• Use the Software to train competing artificial intelligence systems
• Scrape, extract, or systematically collect data from the Software
• Interfere with the operation of our AI systems or recommendation engines

3.3 Safety and Compliance Restrictions
• You may not upload or distribute tune files that pose safety risks
• You must comply with all applicable emissions and environmental regulations
• You may not use the Software to create or distribute illegal modifications
• Professional racing content must be clearly marked for track use only

══════════════════════════════════════════════════════

4. SOFTWARE UPDATES AND MODIFICATIONS

4.1 Updates and Upgrades
[Your App Name] may, at its discretion:

• Provide updates, patches, and upgrades to the Software
• Require installation of updates for continued access
• Modify or discontinue features or functionality
• Update AI algorithms and recommendation systems

4.2 Automatic Updates
The Software may automatically download and install updates. You consent to such automatic updates, which are covered by this EULA.

4.3 Beta and Experimental Features
You may be offered access to beta or experimental features:

• Such features are provided "as is" without warranty
• Beta features may be unstable or incomplete
• [Your App Name] may collect additional feedback and usage data for beta features
• Access to beta features may be revoked at any time

══════════════════════════════════════════════════════

5. PRIVACY AND DATA COLLECTION

5.1 Data Collection
The Software collects and processes data as described in our Privacy Policy, including:

• Device information and usage analytics
• Motorcycle specifications and performance data
• User preferences and behavior patterns
• Diagnostic and error reporting information

5.2 AI Training Data
By using the Software, you understand that:

• Your usage patterns may be used to improve AI algorithms
• Data is aggregated and anonymized for training purposes
• You can opt out of data collection for AI training in your privacy settings
• Sensitive personal information is not used for AI training without explicit consent

5.3 Third-Party Data Sharing
We may share data with third parties as described in our Privacy Policy, subject to appropriate privacy protections and your consent where required.

══════════════════════════════════════════════════════

6. DISCLAIMERS AND WARRANTIES

6.1 AS-IS BASIS
THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

6.2 AI and Recommendation Disclaimers
[Your App Name] SPECIFICALLY DISCLAIMS ANY WARRANTIES REGARDING:

• The accuracy or reliability of AI-generated recommendations
• The suitability of recommended tunes for your specific motorcycle
• The safety or performance outcomes of implementing recommendations
• The completeness or accuracy of compatibility assessments

6.3 Third-Party Content
[Your App Name] does not warrant or endorse:

• Tune files created by third-party users or developers
• Community-generated content and recommendations
• Third-party services integrated with the Software
• Information or advice provided by other users

6.4 Availability and Performance
[Your App Name] does not guarantee:

• Uninterrupted access to the Software or services
• Error-free operation or bug-free performance
• Compatibility with all devices or operating systems
• Availability of specific features or content

══════════════════════════════════════════════════════

7. LIMITATION OF LIABILITY

7.1 Exclusion of Damages
TO THE MAXIMUM EXTENT PERMITTED BY LAW, [Your App Name] SHALL NOT BE LIABLE FOR ANY:

• Indirect, incidental, special, or consequential damages
• Loss of profits, revenue, data, or business opportunities
• Damage to motorcycles, vehicles, or other property
• Personal injury or death resulting from Software use
• Third-party claims or actions

7.2 Maximum Liability Cap
[Your App Name]'S TOTAL LIABILITY FOR ALL CLAIMS RELATED TO THE SOFTWARE SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SOFTWARE OR SUBSCRIPTION SERVICES IN THE TWELVE MONTHS PRECEDING THE CLAIM.

7.3 Safety Limitation
[Your App Name] IS NOT LIABLE FOR ANY DAMAGES RESULTING FROM:

• Implementation of tune files or modifications
• Reliance on AI recommendations or compatibility assessments
• Failure to follow professional installation guidelines
• Use of the Software in violation of applicable laws or regulations

══════════════════════════════════════════════════════

8. INDEMNIFICATION

You agree to defend, indemnify, and hold [Your App Name] harmless from any claims, damages, obligations, losses, liabilities, costs, and expenses (including attorney's fees) arising from:

• Your use of the Software
• Your violation of this EULA or applicable laws
• Your implementation of tune files or modifications
• Content you upload, share, or distribute through the Software
• Your infringement of third-party intellectual property rights

══════════════════════════════════════════════════════

9. TERMINATION

9.1 Termination by You
You may terminate this EULA at any time by:

• Uninstalling the Software from all your devices
• Deleting your account and ceasing use of services
• Providing written notice to [Your Company Name]

9.2 Termination by [Your App Name]
[Your App Name] may terminate this EULA immediately if you:

• Violate any provision of this EULA
• Engage in prohibited activities or illegal conduct
• Fail to pay applicable subscription fees
• Pose a security risk to the Software or community

9.3 Effect of Termination
Upon termination:

• Your license to use the Software immediately ceases
• You must uninstall the Software and cease all use
• [Your App Name] may delete your account and associated data
• Certain provisions of this EULA will survive termination

══════════════════════════════════════════════════════

10. EXPORT COMPLIANCE

10.1 Export Restrictions
The Software may be subject to export control laws and regulations. You agree to:

• Comply with all applicable export control laws
• Not export or re-export the Software to prohibited countries or individuals
• Obtain necessary licenses for international use
• Report any violations to appropriate authorities

10.2 Restricted Parties
You represent that you are not:

• Located in a country subject to US embargo
• Listed on any US government list of prohibited or restricted parties
• Subject to any other export restrictions or sanctions

══════════════════════════════════════════════════════

11. OPEN SOURCE COMPONENTS

11.1 Third-Party Licenses
The Software incorporates certain open source software components, each governed by its own license terms. These components include:

• React Native (MIT License)
• TensorFlow Lite (Apache 2.0 License)
• OpenSSL (OpenSSL License)
• SQLite (Public Domain)
• Various npm packages (see package.json for complete list)

11.2 License Compliance
A complete list of open source components and their respective licenses is available at:
https://revsync.com/licenses

11.3 Copyleft Obligations
For components licensed under copyleft licenses (GPL, LGPL, etc.), [Your App Name] complies with all distribution and source code availability requirements.

══════════════════════════════════════════════════════

12. GOVERNING LAW AND JURISDICTION

12.1 Governing Law
This EULA is governed by the laws of the State of California, United States, without regard to conflict of law principles.

12.2 Jurisdiction and Venue
Any disputes arising under this EULA shall be resolved in the state or federal courts located in San Francisco County, California.

12.3 International Users
Users outside the United States acknowledge that they are importing the Software and agree to comply with applicable local laws.

══════════════════════════════════════════════════════

13. MISCELLANEOUS

13.1 Entire Agreement
This EULA, together with the Terms of Service and Privacy Policy, constitutes the entire agreement regarding the Software and supersedes all prior agreements.

13.2 Amendments
[Your App Name] may modify this EULA by providing notice as described in the Terms of Service. Your continued use constitutes acceptance of modifications.

13.3 Severability
If any provision of this EULA is found unenforceable, the remaining provisions shall remain in full force and effect.

13.4 Assignment
You may not assign this EULA without [Your App Name]'s written consent. [Your App Name] may assign this EULA to any affiliate or successor.

13.5 Contact Information
For questions about this EULA, contact:

Email: licensing@yourcompany.com
Phone: +1 (555) 123-EULA
Address: Legal Department
         [Your Company Name]
         1234 Innovation Drive, Suite 567
         San Francisco, CA 94105
         United States

══════════════════════════════════════════════════════

© 2025 [Your Company Name]. All rights reserved.

This EULA is effective as of the date you first install or use the Software and remains in effect until terminated in accordance with its terms.`;

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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  documentContent: {
    fontSize: 14,
    lineHeight: 22,
    color: Theme.colors.content.primary,
    fontFamily: 'Georgia', // More readable font for legal text
  },
  lastUpdated: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.content.divider,
    alignItems: 'center',
    marginBottom: 40,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: Theme.colors.content.secondary,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 11,
    color: Theme.colors.content.tertiary,
  },
});

export default LegalDocuments; 