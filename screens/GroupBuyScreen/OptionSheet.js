// 공동구매 옵션 선택 시트 (2026-09-30) — 상세 페이지에서 바로 옵션·수량을 고르고 주문서로 넘어간다.
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import T from '../../Components/Constants/DesignTokens';
import { Btn, Chips } from '../../Components/UI';
import { myActiveQuantity, orderTotal, remainingQuantity } from '../../api/groupBuys';
import { Stepper, money, s } from './common';
import { gbCopy } from './strings';

const { COLORS, RADIUS } = T;

export default function OptionSheet({ gb, visible, onClose, onConfirm }) {
  const c = gbCopy();
  const [option, setOption] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (visible && gb) {
      setOption((o) => o || gb.options[0] || null);
      setQuantity(1);
    }
  }, [visible, gb]);

  if (!gb) {
    return null;
  }
  const remaining = remainingQuantity(gb);
  const maxQty = Math.max(1, Math.min(gb.perUserMax - myActiveQuantity(gb), remaining));
  const total = orderTotal(gb, quantity);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={c.no} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={s.h2}>{c.sheetTitle}</Text>

        {gb.options.length ? (
          <View style={{ gap: 6 }}>
            <Text style={s.label}>{c.option}</Text>
            <Chips
              items={gb.options.map((o) => ({ key: o, label: o }))}
              selected={option}
              onSelect={setOption}
            />
          </View>
        ) : null}

        <View style={s.between}>
          <View style={{ gap: 2 }}>
            <Text style={s.label}>{c.quantity}</Text>
            <Text style={s.sub}>
              {c.perUser(gb.perUserMax)}
              {Number.isFinite(remaining) ? ` · ${c.soldLeft(remaining)}` : ''}
            </Text>
          </View>
          <Stepper value={quantity} max={maxQty} onChange={setQuantity} />
        </View>

        <View style={styles.totalRow}>
          <View>
            <Text style={s.strong}>{c.totalLabel}</Text>
            {gb.shippingFee > 0 ? (
              <Text style={s.sub}>{c.shipIncluded(money(gb.shippingFee, gb.currency))}</Text>
            ) : (
              <Text style={s.sub}>{c.freeShipping}</Text>
            )}
          </View>
          <Text style={s.price}>{money(total, gb.currency)}</Text>
        </View>

        <Btn
          title={c.toOrder}
          disabled={gb.options.length > 0 && !option}
          onPress={() => onConfirm({ option, quantity })}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,15,5,0.35)' },
  sheet: {
    backgroundColor: COLORS.BG,
    borderTopLeftRadius: RADIUS.SHEET,
    borderTopRightRadius: RADIUS.SHEET,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 16,
    ...T.SHADOW_SHEET,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.LINE,
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.LINE,
  },
});
