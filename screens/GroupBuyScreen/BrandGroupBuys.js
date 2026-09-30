// 브랜드 공동구매 관리 (2026-09-30) — 목록 + 공동구매 열기(호스트 지정)
// 아르바임 운영도 같은 개설을 ops 콘솔에서 한다(openedBy=ARBAIM). 앱에서는 브랜드 계정만.
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import FEATURES from '../../Components/Constants/Features';
import { Btn, Card, Chips } from '../../Components/UI';
import { listStores, sellerProducts } from '../../api/store';
import {
  COUNTRIES,
  createBrandGroupBuy,
  formatDateTimeInput,
  listBrandGroupBuys,
  parseDateTimeInput,
  validateGroupBuyDraft,
} from '../../api/groupBuys';
import { productName } from '../StoreScreen/strings';
import {
  Failure,
  Field,
  Frame,
  StateBadge,
  dateLabel,
  money,
  requestId,
  s,
  useFocusLoad,
} from './common';
import { gbCopy } from './strings';

export function BrandGroupBuysScreen({ navigation }) {
  const c = gbCopy();
  const { data, loading, error, reload } = useFocusLoad(() => listBrandGroupBuys());
  return (
    <Frame navigation={navigation} title={c.brandTitle} onRefresh={reload} refreshing={loading}>
      <Btn title={c.create} onPress={() => navigation.navigate('BrandGroupBuyCreate')} />
      {error && !data ? <Failure retry={reload} /> : null}
      {data && !data.length ? (
        <Text style={[s.sub, { textAlign: 'center', paddingVertical: 24 }]}>{c.brandEmpty}</Text>
      ) : null}
      {(data || []).map((gb) => (
        <TouchableOpacity
          key={gb.code}
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={() => navigation.navigate('BrandGroupBuyOrders', { code: gb.code })}
        >
          <Card style={{ padding: 14, gap: 6 }}>
            <View style={s.between}>
              <Text style={[s.h2, { flex: 1 }]} numberOfLines={1}>
                {gb.title}
              </Text>
              <StateBadge state={gb.state} />
            </View>
            <Text style={s.sub}>
              @{gb.host.handle} · {money(gb.price, gb.currency)} · {dateLabel(gb.startsAt, false)}~
              {dateLabel(gb.endsAt, false)}
            </Text>
            <Text style={s.sub}>
              {gb.minQuantity
                ? c.progress(gb.reservedQuantity, gb.minQuantity)
                : c.noMin(gb.reservedQuantity)}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
    </Frame>
  );
}

// 판매자 스토어의 승인(PUBLISHED) 상품. 모의 서버 모드에서 스토어가 비어 있으면 시험용 상품 하나.
async function loadProducts() {
  let products = [];
  try {
    const { stores } = await listStores();
    const lists = await Promise.all(
      stores.map((st) => sellerProducts(st.id).catch(() => ({ products: [] }))),
    );
    products = lists
      .flatMap((l) => l.products || [])
      .filter((p) => p.status === 'PUBLISHED')
      .map((p) => ({
        id: String(p.id),
        name: productName(p),
        listPrice: Number(p.price || 0),
        currency: p.currency,
      }));
  } catch (e) {
    products = [];
  }
  if (!products.length && FEATURES.GROUP_BUY_MOCK) {
    products = [{ id: 'sp-mock-1', name: '테스트 상품 (모의)', listPrice: 30000, currency: 'KRW' }];
  }
  return products;
}

const HOUR = 3600000;

export function BrandGroupBuyCreateScreen({ navigation }) {
  const c = gbCopy();
  const f = c.form;
  const [products, setProducts] = useState(null);
  const [busy, setBusy] = useState(false);
  const request = useRef(null);
  const start = new Date(Math.ceil(Date.now() / HOUR) * HOUR);
  const [form, setForm] = useState({
    title: '',
    productId: null,
    hostHandle: '',
    country: 'KR',
    price: '',
    shippingFee: '0',
    minQuantity: '30',
    maxQuantity: '0',
    perUserMax: '5',
    options: '',
    detailImages: '',
    startsAt: formatDateTimeInput(start),
    endsAt: formatDateTimeInput(new Date(start.getTime() + 5 * 24 * HOUR)),
    shipBy: '',
  });

  useEffect(() => {
    loadProducts().then(setProducts);
  }, []);

  const set = (key) => (value) => {
    request.current = null;
    setForm((x) => ({ ...x, [key]: value }));
  };
  const product = (products || []).find((p) => p.id === form.productId);

  const submit = async () => {
    const draft = {
      title: form.title,
      productId: form.productId,
      productName: product?.name,
      listPrice: product?.listPrice || 0,
      productCurrency: product?.currency || null,
      hostHandle: form.hostHandle,
      country: form.country,
      price: form.price,
      shippingFee: form.shippingFee,
      minQuantity: form.minQuantity,
      maxQuantity: form.maxQuantity,
      perUserMax: form.perUserMax,
      options: form.options
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      detailImages: form.detailImages
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
      startsAt: parseDateTimeInput(form.startsAt),
      endsAt: parseDateTimeInput(form.endsAt),
      // 입력했는데 형식이 틀리면 NaN으로 넘겨 검증에서 걸리게 한다(조용히 빠지지 않게)
      shipBy: form.shipBy.trim() ? parseDateTimeInput(form.shipBy) || 'invalid' : null,
    };
    const invalid = validateGroupBuyDraft(draft);
    if (invalid) {
      Alert.alert(c.formError[invalid] || c.formError.generic);
      return;
    }
    if (!request.current) {
      request.current = requestId('gbc');
    }
    setBusy(true);
    try {
      await createBrandGroupBuy(draft, request.current);
      request.current = null;
      Alert.alert(c.created, '', [{ text: c.yes, onPress: () => navigation.goBack() }]);
    } catch (e) {
      const key = e?.body?.error;
      if (key) {
        request.current = null;
      }
      Alert.alert(c.formError[key] || c.formError.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame
      navigation={navigation}
      title={c.createTitle}
      footer={<Btn title={f.submit} onPress={submit} loading={busy} />}
    >
      <Card style={{ padding: 14, gap: 12 }}>
        <Field label={f.title} value={form.title} onChangeText={set('title')} maxLength={60} />
        <View style={{ gap: 6 }}>
          <Text style={s.label}>{f.product}</Text>
          {products && !products.length ? <Text style={s.sub}>{f.noProducts}</Text> : null}
          <Chips
            items={(products || []).map((p) => ({ key: p.id, label: p.name }))}
            selected={form.productId}
            onSelect={set('productId')}
          />
          {product?.listPrice ? (
            <Text style={s.sub}>
              {c.listPrice} {money(product.listPrice, product.currency)}
            </Text>
          ) : null}
          <Text style={s.sub}>{f.productHint}</Text>
        </View>
        <Field
          label={f.host}
          value={form.hostHandle}
          onChangeText={set('hostHandle')}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={s.sub}>{f.hostHint}</Text>
      </Card>

      <Card style={{ padding: 14, gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Text style={s.label}>{f.country}</Text>
          <Chips
            items={Object.keys(COUNTRIES).map((k) => ({ key: k, label: k === 'JP' ? f.jp : f.kr }))}
            selected={form.country}
            onSelect={set('country')}
          />
        </View>
        <Field
          label={f.price}
          value={form.price}
          onChangeText={set('price')}
          keyboardType="number-pad"
        />
        <Field
          label={f.shippingFee}
          value={form.shippingFee}
          onChangeText={set('shippingFee')}
          keyboardType="number-pad"
        />
        <Field
          label={f.minQuantity}
          value={form.minQuantity}
          onChangeText={set('minQuantity')}
          keyboardType="number-pad"
        />
        <Field
          label={f.maxQuantity}
          value={form.maxQuantity}
          onChangeText={set('maxQuantity')}
          keyboardType="number-pad"
        />
        <Field
          label={f.perUserMax}
          value={form.perUserMax}
          onChangeText={set('perUserMax')}
          keyboardType="number-pad"
        />
        <Field label={f.options} value={form.options} onChangeText={set('options')} />
      </Card>

      <Card style={{ padding: 14, gap: 12 }}>
        <Field label={f.startsAt} value={form.startsAt} onChangeText={set('startsAt')} />
        <Field label={f.endsAt} value={form.endsAt} onChangeText={set('endsAt')} />
        <Field label={f.shipBy} value={form.shipBy} onChangeText={set('shipBy')} />
        <Field
          label={f.detailImages}
          value={form.detailImages}
          onChangeText={set('detailImages')}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Card>
    </Frame>
  );
}
