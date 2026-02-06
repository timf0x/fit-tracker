import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Flame, ThumbsUp, Zap, ChevronRight } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { mockFriends } from '@/lib/mock-data';
import i18n from '@/lib/i18n';

export function FriendsCard() {
  const { count, avatars, recentActivity, reactions } = mockFriends;

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Top row: avatars + count | recent activity */}
          <View style={styles.topRow}>
            <View style={styles.leftSection}>
              <View style={styles.avatarStack}>
                {avatars.map((avatar, index) => (
                  <View
                    key={index}
                    style={[
                      styles.avatar,
                      { marginLeft: index > 0 ? -10 : 0, zIndex: avatars.length - index },
                      avatar.type === 'initial' && avatar.color === '#9333EA' && styles.avatarPurple,
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {avatar.type === 'initial' ? avatar.letter : 'A'}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.friendsLink}>
                {count} {i18n.t('home.friends.title')} {'>'}
              </Text>
            </View>

            <View style={styles.rightSection}>
              <View style={styles.recentDot} />
              <Text style={styles.recentLabel}>{i18n.t('home.friends.recent')}</Text>
              <Text style={styles.recentName}>{recentActivity.name}</Text>
              <Text style={styles.recentActivity}>{recentActivity.activity}</Text>
            </View>
          </View>

          {/* Bottom row */}
          <View style={styles.bottomRow}>
            <View style={styles.reactions}>
              <View style={styles.reactionItem}>
                <Flame size={13} color="#f97316" />
                <Text style={styles.reactionCount}>{reactions.fire}</Text>
              </View>
              <View style={styles.reactionItem}>
                <ThumbsUp size={13} color="rgba(113,113,122,1)" />
                <Text style={styles.reactionCount}>{reactions.thumbsUp}</Text>
              </View>
              <View style={styles.reactionItem}>
                <Zap size={13} color="#eab308" />
                <Text style={styles.reactionCount}>{reactions.lightning}</Text>
              </View>
            </View>

            <Pressable style={styles.viewAll}>
              <Text style={styles.viewAllText}>{i18n.t('home.friends.viewAll')}</Text>
              <ChevronRight size={13} color="rgba(161,161,170,1)" />
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  card: {
    padding: 20,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#050505',
  },
  avatarPurple: {
    borderColor: '#9333EA',
  },
  avatarText: {
    color: Colors.text,
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  friendsLink: {
    color: 'rgba(161,161,170,1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  recentLabel: {
    color: '#22c55e',
    fontSize: 9,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
  },
  recentName: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  recentActivity: {
    color: 'rgba(113,113,122,1)',
    fontSize: 11,
    fontFamily: Fonts?.sans,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 14,
  },
  reactions: {
    flexDirection: 'row',
    gap: 16,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionCount: {
    color: 'rgba(161,161,170,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    color: 'rgba(161,161,170,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
