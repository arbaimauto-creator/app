import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { styles } from '../../Components/AddingNewProductScreen';
import Constants from '../../Components/Constants';

export default function ProductIsPromition({ context }) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldTitleContainer}>
        <Text style={styles.fieldTitle}>프로모션 상품 여부</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: 20,
        }}
      >
        <Text style={styles.fieldProductOption}>프로모션 상품</Text>
        <Switch
          trackColor={{
            false: 'rgb(39, 39, 39)',
            true: Constants.COLOR_MAIN_DARK,
          }}
          thumbColor={context.state.isPromotion ? Constants.COLOR_MAIN : 'rgb(113, 113, 113)'}
          ios_backgroundColor="rgb(39, 39, 39)"
          onValueChange={(isPromotion) => {
            context.setState({ isPromotion });
          }}
          value={context.state.isPromotion}
        />
      </View>

      {context.state.isPromotion && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 20,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                color: Constants.TIER_COLORS.EXPLORER,
                fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
                fontSize: 14,
                marginBottom: 5,
              }}
            >
              시작일
            </Text>
            <TouchableOpacity onPress={() => setStartOpen(true)}>
              <Text
                style={{
                  color: Constants.TIER_COLORS.EXPLORER,
                  fontSize: 20,
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                }}
              >
                {dayjs(context.state.promotionStartDate).format('YYYY-MM-DD')}
              </Text>
            </TouchableOpacity>
          </View>
          <DatePicker
            modal
            open={startOpen}
            date={context.state.promotionStartDate}
            mode={'date'}
            onConfirm={(date) => {
              setStartOpen(false);
              context.setState({ promotionStartDate: date });
            }}
            onCancel={() => {
              setStartOpen(false);
            }}
          />

          <Text
            style={{ color: Constants.TIER_COLORS.EXPLORER, fontSize: 20, fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD }}
          >
            ~
          </Text>

          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                color: Constants.TIER_COLORS.EXPLORER,
                fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
                fontSize: 14,
                marginBottom: 5,
              }}
            >
              종료일
            </Text>
            <TouchableOpacity onPress={() => setEndOpen(true)}>
              <Text
                style={{
                  color: Constants.TIER_COLORS.EXPLORER,
                  fontSize: 20,
                  fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
                }}
              >
                {dayjs(context.state.promotionEndDate).format('YYYY-MM-DD')}
              </Text>
            </TouchableOpacity>
          </View>
          <DatePicker
            modal
            open={endOpen}
            date={context.state.promotionEndDate}
            mode={'date'}
            onConfirm={(date) => {
              setEndOpen(false);
              context.setState({ promotionEndDate: date });
            }}
            onCancel={() => {
              setEndOpen(false);
            }}
          />
        </View>
      )}
    </View>
  );
}
