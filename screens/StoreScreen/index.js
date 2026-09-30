import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import T from '../../Components/Constants/DesignTokens';
import { Card, GlassOrbs } from '../../Components/UI';
import {
  listStores,
  connectStore,
  sellerProducts,
  catalog,
  storeOrders,
  startStoreCheckout,
  storeTokenFromLink,
  isStorePortalUrl,
  storeOrigin,
} from '../../api/store';
import { openExternalStore } from '../../api/outbound';
import { productName, productStatus, storeCopy } from './strings';

function Button({ children, onPress, disabled }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[s.button, disabled && s.disabled]}
    >
      <Text style={s.buttonText}>{children}</Text>
    </TouchableOpacity>
  );
}
function Frame({ navigation, title, children, refresh, loading }) {
  const c = storeCopy();
  return (
    <SafeAreaView style={s.page}>
      <GlassOrbs />
      <View style={s.heading}>
        <Button onPress={() => navigation.goBack()}>{c.back}</Button>
        <Text style={s.title}>{title}</Text>
      </View>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          refresh ? <RefreshControl refreshing={!!loading} onRefresh={refresh} /> : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
function Failure({ retry }) {
  const c = storeCopy();
  return (
    <Card>
      <Text style={s.text} accessibilityRole="alert">
        {c.error}
      </Text>
      <Button onPress={retry}>{c.retry}</Button>
    </Card>
  );
}
export function SellerStoreScreen({ navigation, route }) {
  const c = storeCopy();
  const [link, setLink] = useState(route.params?.token || '');
  const [stores, setStores] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setData(null);
    try {
      const result = await listStores();
      setStores(result.stores);
      const id = result.stores.find((x) => x.id === selected)?.id || result.stores[0]?.id;
      if (id) {
        setData(await sellerProducts(id));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selected]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  useFocusEffect(
    useCallback(() => {
      if (route.params?.token) {
        setLink(route.params.token);
      }
    }, [route.params?.token]),
  );
  const connect = async () => {
    const token = storeTokenFromLink(link);
    if (!token) {
      Alert.alert(c.invalidLink);
      return;
    }
    setBusy(true);
    try {
      const r = await connectStore(token);
      setLink('');
      navigation.setParams({ token: undefined });
      setSelected(r.campaignId);
      await load();
    } catch {
      Alert.alert(c.invalidLink);
    } finally {
      setBusy(false);
    }
  };
  const open = (edit) => {
    const url = data?.portalUrl;
    if (!isStorePortalUrl(url)) {
      Alert.alert(c.error);
      return;
    }
    navigation.navigate('StoreWeb', { url: edit ? `${url}?edit=${edit}` : url });
  };
  return (
    <Frame navigation={navigation} title={c.manage} refresh={load} loading={loading}>
      <Card>
        <Text style={s.title}>{c.connect}</Text>
        <Text style={s.text}>{c.link}</Text>
        <TextInput
          accessibilityLabel={c.connect}
          style={s.input}
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button disabled={busy || !link} onPress={connect}>
          {c.connectButton}
        </Button>
      </Card>
      {error && <Failure retry={load} />}
      {stores.map((store) => (
        <Button key={store.id} onPress={() => setSelected(store.id)}>
          {store.brand} · {store.name}
        </Button>
      ))}
      {data && (
        <>
          <Button onPress={() => open()}>
            {c.add} · {c.web}
          </Button>
          {data.products.length === 0 && <Text style={s.text}>{c.empty}</Text>}
          {data.products.map((p) => (
            <Card key={p.id}>
              <Text style={s.title}>{productName(p)}</Text>
              <Text style={s.text}>
                {productStatus(p.status)} · {p.discountPrice ?? p.price} {p.currency}
              </Text>
              {p.reviewNote && <Text style={s.text}>{p.reviewNote}</Text>}
              <Button onPress={() => open(p.id)}>{c.edit}</Button>
              {p.status === 'PUBLISHED' && (
                <Button onPress={() => navigation.navigate('StoreProduct', { productId: p.id })}>
                  {c.market}
                </Button>
              )}
            </Card>
          ))}
        </>
      )}
      <Button onPress={() => navigation.navigate('StoreCatalog')}>{c.market}</Button>
    </Frame>
  );
}
export function StoreCatalogScreen({ navigation }) {
  const c = storeCopy();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await catalog());
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  return (
    <Frame navigation={navigation} title={c.market} refresh={load} loading={loading}>
      <Button onPress={() => navigation.navigate('StoreOrders')}>{c.orders}</Button>
      {error && <Failure retry={load} />}
      {data?.products.length === 0 && <Text style={s.text}>{c.empty}</Text>}
      {data?.products.map((p) => (
        <Card key={p.id}>
          {p.imageUrl && <Image source={{ uri: p.imageUrl }} style={s.image} />}
          <Text style={s.title}>{productName(p)}</Text>
          <Text style={s.text}>
            {p.discountPrice ?? p.price} {p.currency}
          </Text>
          <Button onPress={() => navigation.navigate('StoreProduct', { productId: p.id })}>
            {c.market}
          </Button>
        </Card>
      ))}
    </Frame>
  );
}
export function StoreProductScreen({ navigation, route }) {
  const c = storeCopy();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [country, setCountry] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await catalog(route.params.productId));
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [route.params.productId]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const p = data?.products[0];
  const buy = async () => {
    const q = Number(quantity);
    if (!Number.isInteger(q) || q < 1 || q > 20 || !p.shippingCountries.includes(country)) {
      Alert.alert(c.saveError);
      return;
    }
    setBusy(true);
    const signature = `${p.id}:${q}:${country}`;
    if (request.current?.signature !== signature) {
      request.current = {
        signature,
        id: `store-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
    }
    try {
      const checkout = await startStoreCheckout({
        productId: p.id,
        quantity: q,
        country,
        requestId: request.current.id,
        expectedPrice: p.discountPrice ?? p.price,
        expectedShipping: p.shipmentCost,
        expectedCurrency: p.currency,
      });
      if (!checkout.url?.startsWith('https://checkout.stripe.com/')) {
        throw new Error('Invalid checkout');
      }
      navigation.navigate('StoreWeb', { url: checkout.url, checkout: true });
    } catch (e) {
      // Retry ambiguous network failures with the SAME key; closed orders require a fresh attempt.
      if (['order_closed', 'stock_changed', 'product_unavailable', 'price_changed'].includes(e?.body?.error)) {
        request.current = null;
      }
      Alert.alert(c.saveError);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Frame
      navigation={navigation}
      title={p ? productName(p) : c.market}
      refresh={load}
      loading={loading}
    >
      {error && <Failure retry={load} />}
      {p && (
        <Card>
          {p.imageUrl && <Image source={{ uri: p.imageUrl }} style={s.image} />}
          <Text style={s.title}>{productName(p)}</Text>
          <Text style={s.text}>
            {p.discountPrice ?? p.price} {p.currency}
          </Text>
          <Text style={s.text}>{p.description}</Text>
          <Text style={s.text}>{p.optionsNote}</Text>
          <Text style={s.text}>
            {c.shipping}: {p.shipmentCost} {p.currency}
          </Text>
          {p.stock === 0 ? (
            <Text style={s.text}>{c.soldOut}</Text>
          ) : p.externalUrl ? (
            <Button
              onPress={() =>
                openExternalStore({
                  sellerId: String(p.campaignId),
                  productId: `ops-${p.id}`,
                  url: p.externalUrl,
                }).catch(() => Alert.alert(c.webError))
              }
            >
              {c.external}
            </Button>
          ) : data.checkoutEnabled && p.shippingCountries.length ? (
            <>
              <Text style={s.text}>{c.country}</Text>
              <View style={s.countries}>
                {p.shippingCountries.map((code) => (
                  <Button
                    key={code}
                    onPress={() => {
                      request.current = null;
                      setCountry(code);
                    }}
                  >
                    {country === code ? `✓ ${code}` : code}
                  </Button>
                ))}
              </View>
              <Text style={s.text}>{c.quantity}</Text>
              <TextInput
                accessibilityLabel={c.quantity}
                keyboardType="number-pad"
                style={s.input}
                value={quantity}
                onChangeText={(value) => {
                  request.current = null;
                  setQuantity(value);
                }}
              />
              <Button disabled={busy || !country} onPress={buy}>
                {c.buy}
              </Button>
            </>
          ) : (
            <Text style={s.text}>{c.unavailable}</Text>
          )}
        </Card>
      )}
    </Frame>
  );
}
export function StoreOrdersScreen({ navigation }) {
  const c = storeCopy();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setOrders((await storeOrders()).orders);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const labels = {
    PENDING: c.pending,
    PAID: c.paid,
    SHIPPED: c.shipped,
    EXPIRED: c.expired,
    FAILED: c.failed,
    REFUNDED: c.refunded,
    PARTIALLY_REFUNDED: c.refunded,
  };
  return (
    <Frame navigation={navigation} title={c.orders} refresh={load} loading={loading}>
      {error ? (
        <Failure retry={load} />
      ) : (
        !orders.length && !loading && <Text style={s.text}>{c.orderEmpty}</Text>
      )}
      {orders.map((o) => (
        <Card key={o.id}>
          <Text style={s.title}>
            {o.productName} × {o.quantity}
          </Text>
          <Text style={s.text}>{labels[o.status] || o.status}</Text>
          <Text style={s.text}>
            {o.totalAmount / (o.currency === 'USD' ? 100 : 1)} {o.currency}
          </Text>
          {o.tracking && <Text style={s.text}>{o.tracking}</Text>}
          <Text selectable style={s.text}>
            {o.id}
          </Text>
        </Card>
      ))}
    </Frame>
  );
}
export function StoreWebScreen({ navigation, route }) {
  const c = storeCopy();
  const web = useRef(null);
  const [failed, setFailed] = useState(false);
  const url = route.params?.url;
  const checkout = route.params?.checkout === true;
  const valid = checkout
    ? typeof url === 'string' && url.startsWith('https://checkout.stripe.com/')
    : isStorePortalUrl(url);
  const allow = ({ url: target }) => {
    if (
      target === 'greyd://market-orders' ||
      target.startsWith(`${storeOrigin}/portal/store-checkout`)
    ) {
      navigation.replace('StoreOrders');
      return false;
    }
    if (target.startsWith('greyd://')) {
      Linking.openURL(target).catch(() => {});
      return false;
    }
    return (
      target === 'about:blank' ||
      (checkout ? target.startsWith('https://') : isStorePortalUrl(target))
    );
  };
  return (
    <SafeAreaView style={s.page}>
      <View style={s.heading}>
        <Button
          onPress={() => (checkout ? navigation.replace('StoreOrders') : navigation.goBack())}
        >
          {c.back}
        </Button>
        <Text style={s.title}>{checkout ? c.buy : c.manage}</Text>
      </View>
      {!valid || failed ? (
        <View style={s.content}>
          <Text style={s.text}>{c.webError}</Text>
          {valid && (
            <Button
              onPress={() => {
                setFailed(false);
                web.current?.reload();
              }}
            >
              {c.retry}
            </Button>
          )}
        </View>
      ) : (
        <WebView
          ref={web}
          source={{ uri: url }}
          onShouldStartLoadWithRequest={allow}
          onError={() => setFailed(true)}
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode >= 400) {
              setFailed(true);
            }
          }}
          startInLoadingState
          renderLoading={() => <ActivityIndicator />}
          setSupportMultipleWindows={false}
        />
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.COLORS.BG },
  heading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12 },
  content: { padding: 16, paddingBottom: 48, gap: 16 },
  title: { fontSize: 18, fontWeight: '700', color: T.COLORS.INK, flexShrink: 1 },
  text: { fontSize: 14, color: T.COLORS.INK, lineHeight: 22, marginVertical: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#B8ADA0',
    borderRadius: 10,
    padding: 12,
    color: T.COLORS.INK,
    marginVertical: 10,
  },
  button: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: '#F4D7A0',
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  buttonText: { color: '#382B1B', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  image: { width: '100%', height: 220, borderRadius: 14, resizeMode: 'contain' },
  countries: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
