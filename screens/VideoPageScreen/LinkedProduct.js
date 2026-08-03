import { useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import ProductListItemView from '../../Components/ProductListItemView';
import { getKRWPerUSD } from '../../Components/utils';

function LinkedProduct({ context, linkedProduct, marginTop, marginHorizontal }) {
  const { video } = context.state;
  const route = useRoute();
  const {
    params: { logonUserId },
  } = useRoute();
  const [KRWPerUSD, setKRWPerUSD] = useState(1300);

  useEffect(() => {
    async function getCurrency() {
      const currency = await getKRWPerUSD();
      setKRWPerUSD(currency);
    }

    getCurrency();
  }, []);

  if (
    linkedProduct.title === '0' ||
    !linkedProduct.titleByCountry ||
    (linkedProduct.statusCode && linkedProduct.statusCode === 1)
  ) {
    return null;
  }

  return (
    <View
      style={{
        marginHorizontal: marginHorizontal || 20,
        marginTop: marginTop || 30,
        borderRadius: 14,
      }}
    >
      <ProductListItemView
        navigation={context.props.navigation}
        data={video.linkedProduct}
        videoId={video._id}
        type={'summary'}
        logonUserId={logonUserId}
        route={route}
        linkedProduct={linkedProduct}
        KRWPerUSD={KRWPerUSD}
      />
    </View>
  );

  // const MemoizedLinkedProduct = (
  //   <View style={{ marginHorizontal: 20, marginTop: 30, borderRadius: 14 }}>
  //     <ProductListItemView
  //       navigation={context.props.navigation}
  //       data={video.linkedProduct}
  //       videoId={video._id}
  //       type={'summary'}
  //       logonUserId={logonUserId}
  //       route={route}
  //       linkedProduct={linkedProduct}
  //     />
  //   </View>
  // );

  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // return React.useMemo(() => MemoizedLinkedProduct, [video._id, video.linkedProduct]);
}

export default LinkedProduct;
