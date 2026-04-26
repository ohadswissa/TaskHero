import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gradient } from '@/components/common/Gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fonts } from '@/theme';

const { width: SW } = Dimensions.get('window');

// ─── Hero Character (Pure RN Views) ───
function HeroCharacter({ skin, hair, hairColor, outfit, accessory, expression }: {
  skin: string; hair: string; hairColor: string; outfit: { color1: string; color2: string; icon: string };
  accessory: string; expression: string;
}) {
  const idleAnim = useRef(new Animated.Value(0)).current;
  const capeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(idleAnim, { toValue: -6, duration: 1500, useNativeDriver: true }),
      Animated.timing(idleAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(capeAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(capeAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  const eyeW = expression === 'determined' ? 10 : 8;
  const eyeH = expression === 'squint' ? 3 : expression === 'wide' ? 10 : 8;
  const mouthW = expression === 'grin' ? 20 : expression === 'serious' ? 10 : 14;
  const mouthCurve = expression === 'serious' ? 0 : expression === 'grin' ? 10 : 6;

  // Hair shape
  const hairStyles: Record<string, any> = {
    short: { width: 62, height: 18, borderTopLeftRadius: 31, borderTopRightRadius: 31, top: -6 },
    spiky: { width: 70, height: 28, borderTopLeftRadius: 6, borderTopRightRadius: 6, top: -14 },
    long: { width: 66, height: 34, borderTopLeftRadius: 33, borderTopRightRadius: 33, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, top: -10 },
    curly: { width: 68, height: 30, borderRadius: 16, top: -10 },
    ponytail: { width: 60, height: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, top: -8 },
    mohawk: { width: 20, height: 36, borderTopLeftRadius: 10, borderTopRightRadius: 10, top: -20, alignSelf: 'center' as const },
  };
  const hs = hairStyles[hair] || hairStyles.short;

  return (
    <Animated.View style={[heroStyles.root, { transform: [{ translateY: idleAnim }] }]}>
      {/* Shadow */}
      <View style={heroStyles.shadow} />

      {/* Cape (behind body) */}
      {outfit.icon === 'shield' && (
        <Animated.View style={[heroStyles.cape, {
          backgroundColor: outfit.color1,
          transform: [{ scaleX: capeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }],
        }]} />
      )}

      {/* Body */}
      <View style={[heroStyles.body, { backgroundColor: outfit.color1 }]}>
        {/* Outfit details */}
        <View style={[heroStyles.bodyStripe, { backgroundColor: outfit.color2 }]} />
        <View style={heroStyles.outfitIcon}>
          <Ionicons name={outfit.icon as any} size={20} color="rgba(255,255,255,0.7)" />
        </View>
        {/* Belt */}
        <View style={heroStyles.belt}>
          <View style={heroStyles.beltBuckle} />
        </View>
      </View>

      {/* Arms */}
      <View style={[heroStyles.armL, { backgroundColor: skin }]} />
      <View style={[heroStyles.armR, { backgroundColor: skin }]} />

      {/* Hands */}
      <View style={[heroStyles.handL, { backgroundColor: skin }]} />
      <View style={[heroStyles.handR, { backgroundColor: skin }]} />

      {/* Head */}
      <View style={[heroStyles.head, { backgroundColor: skin }]}>
        {/* Hair */}
        <View style={[heroStyles.hair, hs, { backgroundColor: hairColor }]}>
          {hair === 'spiky' && (
            <>
              <View style={[heroStyles.spike, { left: 6, transform: [{ rotate: '-15deg' }] }]} />
              <View style={[heroStyles.spike, { left: 20, height: 14 }]} />
              <View style={[heroStyles.spike, { left: 34, transform: [{ rotate: '10deg' }] }]} />
              <View style={[heroStyles.spike, { left: 48, transform: [{ rotate: '15deg' }], height: 10 }]} />
            </>
          )}
          {hair === 'ponytail' && (
            <View style={[heroStyles.ponytailTail, { backgroundColor: hairColor }]} />
          )}
        </View>

        {/* Accessory */}
        {accessory === 'crown' && (
          <View style={heroStyles.crownContainer}>
            <View style={heroStyles.crownBase}>
              <View style={[heroStyles.crownPoint, { left: 0 }]} />
              <View style={[heroStyles.crownPoint, { left: 10 }]} />
              <View style={[heroStyles.crownPoint, { left: 20 }]} />
            </View>
          </View>
        )}
        {accessory === 'glasses' && (
          <View style={heroStyles.glasses}>
            <View style={heroStyles.glassLens} />
            <View style={heroStyles.glassBridge} />
            <View style={heroStyles.glassLens} />
          </View>
        )}
        {accessory === 'bandana' && (
          <View style={[heroStyles.bandana, { backgroundColor: '#EF4444' }]}>
            <View style={heroStyles.bandanaTail} />
          </View>
        )}
        {accessory === 'mask' && (
          <View style={heroStyles.heroMask} />
        )}

        {/* Eyes */}
        <View style={heroStyles.eyeRow}>
          <View style={[heroStyles.eye, { width: eyeW, height: eyeH }]}>
            <View style={heroStyles.eyeShine} />
          </View>
          <View style={[heroStyles.eye, { width: eyeW, height: eyeH }]}>
            <View style={heroStyles.eyeShine} />
          </View>
        </View>

        {/* Cheeks */}
        <View style={[heroStyles.cheek, { left: 8 }]} />
        <View style={[heroStyles.cheek, { right: 8 }]} />

        {/* Mouth */}
        <View style={[heroStyles.mouth, { width: mouthW }]}>
          {mouthCurve > 0 && <View style={[heroStyles.smile, { width: mouthW, borderBottomLeftRadius: mouthCurve, borderBottomRightRadius: mouthCurve }]} />}
          {mouthCurve === 0 && <View style={[heroStyles.seriousMouth, { width: mouthW }]} />}
        </View>

        {/* Ears */}
        <View style={[heroStyles.ear, heroStyles.earL, { backgroundColor: skin }]} />
        <View style={[heroStyles.ear, heroStyles.earR, { backgroundColor: skin }]} />
      </View>

      {/* Legs */}
      <View style={heroStyles.legs}>
        <View style={[heroStyles.leg, { backgroundColor: outfit.color2 }]}>
          <View style={heroStyles.shoe} />
        </View>
        <View style={[heroStyles.leg, { backgroundColor: outfit.color2 }]}>
          <View style={heroStyles.shoe} />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Data ───
const SKIN_TONES = [
  { id: 'fair', color: '#FDEBD0', label: 'Fair' },
  { id: 'light', color: '#F5CBA7', label: 'Light' },
  { id: 'medium', color: '#D4A574', label: 'Medium' },
  { id: 'tan', color: '#A0522D', label: 'Tan' },
  { id: 'dark', color: '#6B3A2A', label: 'Dark' },
];

const HAIR_STYLES = [
  { id: 'short', label: 'Short', icon: 'cut' },
  { id: 'long', label: 'Long', icon: 'water' },
  { id: 'curly', label: 'Curly', icon: 'cloud' },
  { id: 'spiky', label: 'Spiky', icon: 'flash' },
  { id: 'ponytail', label: 'Ponytail', icon: 'ribbon' },
  { id: 'mohawk', label: 'Mohawk', icon: 'flame' },
];

const HAIR_COLORS = [
  { id: 'brown', color: '#5C3317' },
  { id: 'black', color: '#1a1a1a' },
  { id: 'blonde', color: '#DAA520' },
  { id: 'red', color: '#B22222' },
  { id: 'blue', color: '#4169E1' },
  { id: 'purple', color: '#7C3AED' },
  { id: 'pink', color: '#EC4899' },
  { id: 'green', color: '#059669' },
];

const EXPRESSIONS = [
  { id: 'happy', label: 'Happy', icon: 'happy' },
  { id: 'determined', label: 'Brave', icon: 'flame' },
  { id: 'grin', label: 'Grin', icon: 'sunny' },
  { id: 'serious', label: 'Serious', icon: 'shield' },
  { id: 'wide', label: 'Surprised', icon: 'eye' },
  { id: 'squint', label: 'Cool', icon: 'glasses' },
];

const OUTFITS = [
  { id: 'hero', label: 'Hero Cape', color1: '#EF4444', color2: '#B91C1C', icon: 'shield', cost: 0, unlocked: true },
  { id: 'knight', label: 'Knight', color1: '#6B7280', color2: '#374151', icon: 'shield-checkmark', cost: 50, unlocked: true },
  { id: 'wizard', label: 'Wizard', color1: '#7C3AED', color2: '#5B21B6', icon: 'sparkles', cost: 75, unlocked: true },
  { id: 'ranger', label: 'Ranger', color1: '#059669', color2: '#065F46', icon: 'leaf', cost: 60, unlocked: true },
  { id: 'astronaut', label: 'Space', color1: '#F8FAFC', color2: '#94A3B8', icon: 'planet', cost: 100, unlocked: false },
  { id: 'ninja', label: 'Ninja', color1: '#1F2937', color2: '#111827', icon: 'flash', cost: 120, unlocked: false },
  { id: 'pirate', label: 'Pirate', color1: '#92400E', color2: '#78350F', icon: 'skull', cost: 150, unlocked: false },
  { id: 'royal', label: 'Royal', color1: '#B45309', color2: '#92400E', icon: 'diamond', cost: 200, unlocked: false },
];

const ACCESSORIES = [
  { id: 'none', label: 'None', icon: 'close-circle', cost: 0, unlocked: true },
  { id: 'crown', label: 'Crown', icon: 'diamond', cost: 30, unlocked: true },
  { id: 'glasses', label: 'Glasses', icon: 'glasses', cost: 20, unlocked: true },
  { id: 'bandana', label: 'Bandana', icon: 'ribbon', cost: 25, unlocked: true },
  { id: 'mask', label: 'Hero Mask', icon: 'eye', cost: 40, unlocked: false },
];

type TabKey = 'skin' | 'hair' | 'face' | 'outfit' | 'extras';

export default function AvatarScreen() {
  const [tab, setTab] = useState<TabKey>('skin');
  const [skinIdx, setSkinIdx] = useState(1);
  const [hairStyle, setHairStyle] = useState('short');
  const [hairColorIdx, setHairColorIdx] = useState(0);
  const [expression, setExpression] = useState('happy');
  const [outfitId, setOutfitId] = useState('hero');
  const [accessoryId, setAccessoryId] = useState('crown');
  const [coins] = useState(75);

  const currentOutfit = OUTFITS.find(o => o.id === outfitId) || OUTFITS[0];

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'skin', label: 'Skin', icon: 'color-palette' },
    { key: 'hair', label: 'Hair', icon: 'cut' },
    { key: 'face', label: 'Face', icon: 'happy' },
    { key: 'outfit', label: 'Outfit', icon: 'shirt' },
    { key: 'extras', label: 'Extras', icon: 'sparkles' },
  ];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <Gradient colors={['#4F46E5', '#7C3AED', '#A78BFA']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Hero Builder</Text>
            <Text style={s.headerSub}>Customize your champion</Text>
          </View>
          <View style={s.coinBadge}>
            <Ionicons name="diamond" size={14} color="#FBBF24" />
            <Text style={s.coinText}>{coins}</Text>
          </View>
        </View>
      </Gradient>

      {/* Character Preview */}
      <View style={s.previewArea}>
        <Gradient colors={['#1E1B4B', '#312E81', '#3730A3']} style={s.previewGradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
          {/* Sparkle particles */}
          {[...Array(5)].map((_, i) => (
            <View key={i} style={[s.sparkle, { left: `${10 + i * 18}%`, top: `${15 + (i % 3) * 20}%`, opacity: 0.3 + (i % 3) * 0.2 }]} />
          ))}
          {/* Ground */}
          <View style={s.ground}>
            <Gradient colors={['rgba(139,92,246,0.3)', 'rgba(99,102,241,0.1)']} style={s.groundGlow} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
          </View>

          <HeroCharacter
            skin={SKIN_TONES[skinIdx].color}
            hair={hairStyle}
            hairColor={HAIR_COLORS[hairColorIdx].color}
            outfit={currentOutfit}
            accessory={accessoryId}
            expression={expression}
          />
        </Gradient>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons name={t.icon as any} size={18} color={tab === t.key ? '#FFF' : 'rgba(255,255,255,0.4)'} />
            <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Options */}
      <ScrollView style={s.optionsArea} showsVerticalScrollIndicator={false}>
        {tab === 'skin' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Skin Tone</Text>
            <View style={s.swatchRow}>
              {SKIN_TONES.map((st, i) => (
                <TouchableOpacity key={st.id} style={[s.swatchBtn, skinIdx === i && s.swatchActive]} onPress={() => setSkinIdx(i)}>
                  <View style={[s.swatch, { backgroundColor: st.color }]} />
                  <Text style={s.swatchLabel}>{st.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {tab === 'hair' && (
          <>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Style</Text>
              <View style={s.chipGrid}>
                {HAIR_STYLES.map(hs => (
                  <TouchableOpacity key={hs.id} style={[s.chip, hairStyle === hs.id && s.chipActive]} onPress={() => setHairStyle(hs.id)}>
                    <Ionicons name={hs.icon as any} size={20} color={hairStyle === hs.id ? '#FFF' : '#888'} />
                    <Text style={[s.chipText, hairStyle === hs.id && s.chipTextActive]}>{hs.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Color</Text>
              <View style={s.colorRow}>
                {HAIR_COLORS.map((hc, i) => (
                  <TouchableOpacity key={hc.id} onPress={() => setHairColorIdx(i)}>
                    <View style={[s.colorCircle, { backgroundColor: hc.color }, hairColorIdx === i && s.colorActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {tab === 'face' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Expression</Text>
            <View style={s.chipGrid}>
              {EXPRESSIONS.map(e => (
                <TouchableOpacity key={e.id} style={[s.chip, expression === e.id && s.chipActive]} onPress={() => setExpression(e.id)}>
                  <Ionicons name={e.icon as any} size={20} color={expression === e.id ? '#FFF' : '#888'} />
                  <Text style={[s.chipText, expression === e.id && s.chipTextActive]}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {tab === 'outfit' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Outfit</Text>
            <View style={s.outfitGrid}>
              {OUTFITS.map(o => (
                <TouchableOpacity
                  key={o.id}
                  style={[s.outfitCard, outfitId === o.id && s.outfitCardActive, !o.unlocked && s.outfitLocked]}
                  onPress={() => o.unlocked && setOutfitId(o.id)}
                  activeOpacity={o.unlocked ? 0.7 : 1}
                >
                  <View style={[s.outfitPreview, { backgroundColor: o.color1 }]}>
                    <Ionicons name={o.icon as any} size={24} color="rgba(255,255,255,0.8)" />
                  </View>
                  <Text style={s.outfitLabel}>{o.label}</Text>
                  {!o.unlocked && (
                    <View style={s.lockBadge}>
                      <Ionicons name="lock-closed" size={8} color="#FFF" />
                      <Ionicons name="diamond" size={8} color="#FBBF24" />
                      <Text style={s.lockCost}>{o.cost}</Text>
                    </View>
                  )}
                  {o.unlocked && outfitId === o.id && (
                    <View style={s.equippedBadge}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {tab === 'extras' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Accessories</Text>
            <View style={s.outfitGrid}>
              {ACCESSORIES.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={[s.outfitCard, accessoryId === a.id && s.outfitCardActive, !a.unlocked && s.outfitLocked]}
                  onPress={() => a.unlocked && setAccessoryId(a.id)}
                  activeOpacity={a.unlocked ? 0.7 : 1}
                >
                  <View style={[s.outfitPreview, { backgroundColor: accessoryId === a.id ? '#8B5CF6' : '#2A2A4A' }]}>
                    <Ionicons name={a.icon as any} size={24} color={accessoryId === a.id ? '#FFF' : '#888'} />
                  </View>
                  <Text style={s.outfitLabel}>{a.label}</Text>
                  {!a.unlocked && (
                    <View style={s.lockBadge}>
                      <Ionicons name="lock-closed" size={8} color="#FFF" />
                      <Ionicons name="diamond" size={8} color="#FBBF24" />
                      <Text style={s.lockCost}>{a.cost}</Text>
                    </View>
                  )}
                  {a.unlocked && accessoryId === a.id && a.id !== 'none' && (
                    <View style={s.equippedBadge}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: spacing.xxxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Hero Character Styles ───
const heroStyles = StyleSheet.create({
  root: { alignItems: 'center', marginBottom: 20 },
  shadow: {
    position: 'absolute', bottom: -10, width: 60, height: 12,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 30,
  },
  head: {
    width: 60, height: 56, borderRadius: 28,
    position: 'absolute', top: -36, zIndex: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  hair: { position: 'absolute', zIndex: 11 },
  spike: {
    position: 'absolute', top: -8, width: 8, height: 12,
    backgroundColor: 'inherit', borderRadius: 3,
  },
  ponytailTail: {
    position: 'absolute', right: -12, top: 4, width: 10, height: 28,
    borderRadius: 5, transform: [{ rotate: '15deg' }],
  },
  eyeRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  eye: {
    backgroundColor: '#1E1B4B', borderRadius: 5,
    alignItems: 'flex-end', justifyContent: 'flex-start', padding: 1,
  },
  eyeShine: {
    width: 3, height: 3, backgroundColor: '#FFF', borderRadius: 2,
  },
  cheek: {
    position: 'absolute', top: '60%', width: 8, height: 5,
    backgroundColor: 'rgba(236,72,153,0.3)', borderRadius: 4,
  },
  mouth: { marginTop: 4, alignItems: 'center' },
  smile: {
    height: 6, borderWidth: 0, backgroundColor: '#1E1B4B',
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
  },
  seriousMouth: {
    height: 2, backgroundColor: '#1E1B4B', borderRadius: 1,
  },
  ear: {
    position: 'absolute', width: 8, height: 12, borderRadius: 4, top: '35%',
  },
  earL: { left: -4 },
  earR: { right: -4 },
  body: {
    width: 50, height: 55, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  bodyStripe: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
  },
  outfitIcon: { position: 'absolute', top: 8 },
  belt: {
    position: 'absolute', bottom: '38%', width: '100%', height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  beltBuckle: {
    position: 'absolute', alignSelf: 'center', width: 8, height: 8,
    backgroundColor: '#FBBF24', borderRadius: 2, top: -2, left: '42%',
  },
  cape: {
    position: 'absolute', top: -20, width: 70, height: 85,
    borderBottomLeftRadius: 35, borderBottomRightRadius: 35,
    zIndex: -1, opacity: 0.7,
  },
  armL: {
    position: 'absolute', left: -8, top: 10, width: 12, height: 30,
    borderRadius: 6, transform: [{ rotate: '-10deg' }],
  },
  armR: {
    position: 'absolute', right: -8, top: 10, width: 12, height: 30,
    borderRadius: 6, transform: [{ rotate: '10deg' }],
  },
  handL: {
    position: 'absolute', left: -10, top: 38, width: 10, height: 10,
    borderRadius: 5,
  },
  handR: {
    position: 'absolute', right: -10, top: 38, width: 10, height: 10,
    borderRadius: 5,
  },
  legs: { flexDirection: 'row', gap: 6, marginTop: -2 },
  leg: { width: 16, height: 24, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  shoe: {
    position: 'absolute', bottom: 0, left: -2, right: -2, height: 8,
    backgroundColor: '#1F2937', borderRadius: 5,
  },
  crownContainer: { position: 'absolute', top: -22, zIndex: 20 },
  crownBase: { width: 28, height: 8, backgroundColor: '#FBBF24', borderRadius: 2 },
  crownPoint: {
    position: 'absolute', top: -8, width: 6, height: 10,
    backgroundColor: '#FBBF24', borderTopLeftRadius: 3, borderTopRightRadius: 3,
  },
  glasses: {
    position: 'absolute', top: '32%', flexDirection: 'row', alignItems: 'center', zIndex: 12,
  },
  glassLens: {
    width: 14, height: 10, borderRadius: 5,
    borderWidth: 1.5, borderColor: '#1E1B4B', backgroundColor: 'rgba(147,197,253,0.3)',
  },
  glassBridge: { width: 4, height: 1.5, backgroundColor: '#1E1B4B' },
  bandana: {
    position: 'absolute', top: 6, left: -6, right: -6, height: 8,
    borderRadius: 3, zIndex: 12,
  },
  bandanaTail: {
    position: 'absolute', right: -8, top: 2, width: 14, height: 6,
    backgroundColor: '#EF4444', borderRadius: 3, transform: [{ rotate: '20deg' }],
  },
  heroMask: {
    position: 'absolute', top: '22%', left: 4, right: 4, height: 14,
    backgroundColor: '#1E1B4B', borderRadius: 7, zIndex: 12, opacity: 0.85,
  },
});

// ─── Screen Styles ───
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0D2E' },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 22, color: '#FFF' },
  headerSub: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  coinText: { fontFamily: fonts.bold, fontSize: 13, color: '#FFF' },

  previewArea: { paddingHorizontal: spacing.md },
  previewGradient: {
    height: 240, borderRadius: 24, alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 20, overflow: 'hidden',
  },
  sparkle: {
    position: 'absolute', width: 4, height: 4,
    backgroundColor: '#A78BFA', borderRadius: 2,
  },
  ground: {
    position: 'absolute', bottom: 0, width: '60%', height: 30, borderRadius: 100, overflow: 'hidden',
  },
  groundGlow: { flex: 1 },

  tabRow: {
    flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.xl, padding: 4,
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: borderRadius.lg, gap: 2,
  },
  tabActive: { backgroundColor: '#8B5CF6' },
  tabLabel: { fontFamily: fonts.semiBold, fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  tabLabelActive: { color: '#FFF' },

  optionsArea: { flex: 1 },
  section: { padding: spacing.lg },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#FFF', marginBottom: spacing.md },

  swatchRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  swatchBtn: {
    alignItems: 'center', padding: spacing.sm, borderRadius: borderRadius.lg,
    borderWidth: 2, borderColor: 'transparent', width: '18%',
  },
  swatchActive: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)' },
  swatch: { width: 40, height: 40, borderRadius: 20, marginBottom: 4 },
  swatchLabel: { fontFamily: fonts.semiBold, fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  chipText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#888' },
  chipTextActive: { color: '#FFF' },

  colorRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  colorCircle: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: 'transparent',
  },
  colorActive: { borderColor: '#FFF' },

  outfitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  outfitCard: {
    width: '23%', alignItems: 'center', padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.xl,
    borderWidth: 2, borderColor: 'transparent',
  },
  outfitCardActive: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)' },
  outfitLocked: { opacity: 0.4 },
  outfitPreview: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  outfitLabel: { fontFamily: fonts.semiBold, fontSize: 10, color: '#FFF', textAlign: 'center' },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  lockCost: { fontFamily: fonts.bold, fontSize: 9, color: '#FBBF24' },
  equippedBadge: {
    position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#34D399', alignItems: 'center', justifyContent: 'center',
  },
});
