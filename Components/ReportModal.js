import React, { useRef } from 'react';
import Toast from 'react-native-easy-toast';
import { getStatusBarHeight } from 'react-native-safearea-height';
import APIprovider from './APIprovider';
import Constants from './Constants';
import Codes from './Constants/Codes';
import Strings from './Strings';
import { SelectionModal } from './Views';

const ReportModal = ({ visible, contentInfo, onCancel }) => {
  const toastRef = useRef();
  let title;
  let contents;
  const handleAction = (code) => {
    // api 호출 및 토스트
    APIprovider.reportContent(contentInfo.type, contentInfo.id, contentInfo.wrapperId, code).then(
      (res) => {
        console.log('reportContent result : ', res);
      },
    );
    toastRef.current.show(Strings.REPORT_COMPLETE);
    onCancel();
  };
  const reviewContents = [
    {
      actionTitle: Strings.REPORT_REASON_SEXUAL_REVIEW,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.SEXUAL_REVIEW),
    },
    {
      actionTitle: Strings.REPORT_REASON_VIOLENT_REVIEW,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.VIOLENT_REVIEW),
    },
    {
      actionTitle: Strings.REPORT_REASON_MALICIOUS_REVIEW,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.MALICIOUS_REVIEW),
    },
    {
      actionTitle: Strings.REPORT_REASON_HARASSMENT_REVIEW,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.HARASSMENT_REVIEW),
    },
    {
      actionTitle: Strings.REPORT_REASON_INJURIOUS_REVIEW,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.INJURIOUS_REVIEW),
    },
    {
      actionTitle: Strings.REPORT_REASON_INVALID_REVIEW,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.INVALID_REVIEW),
    },
  ];

  const productContents = [
    {
      actionTitle: Strings.REPORT_REASON_SEXUAL_PRODUCT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.SEXUAL_PRODUCT),
    },
    {
      actionTitle: Strings.REPORT_REASON_VIOLENT_PRODUCT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.VIOLENT_PRODUCT),
    },
    {
      actionTitle: Strings.REPORT_REASON_DRUGWEAPON_PRODUCT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.DRUGWEAPON_PRODUCT),
    },
    {
      actionTitle: Strings.REPORT_REASON_ILLEGAL_PRODUCT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.ILLEGAL_PRODUCT),
    },
    {
      actionTitle: Strings.REPORT_REASON_INJURIOUS_PRODUCT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.INJURIOUS_PRODUCT),
    },
    {
      actionTitle: Strings.REPORT_REASON_UNAVAILABLE_PRODUCT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.UNAVAILABLE_PRODUCT),
    },
    {
      actionTitle: Strings.REPORT_REASON_INVALID_PRODUCT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.INVALID_PRODUCT),
    },
  ];

  const userContents = [
    {
      actionTitle: Strings.REPORT_REASON_HARASSMENT_USER,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.HARASSMENT_USER),
    },
    {
      actionTitle: Strings.REPORT_REASON_PRIVACY_USER,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.PRIVACY_USER),
    },
    {
      actionTitle: Strings.REPORT_REASON_IMPERSONATION_USER,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.IMPERSONATION_USER),
    },
    {
      actionTitle: Strings.REPORT_REASON_VIOLENT_USER,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.VIOLENT_USER),
    },
    {
      actionTitle: Strings.REPORT_REASON_CHILDABUSE_USER,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.CHILDABUSE_USER),
    },
    {
      actionTitle: Strings.REPORT_REASON_HATESPEECH_USER,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.HATESPEECH_USER),
    },
    {
      actionTitle: Strings.REPORT_REASON_SPAM_USER,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.SPAM_USER),
    },
    {
      actionTitle: Strings.REPORT_REASON_OTHERS_USER,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.OTHERS_USER),
    },
  ];

  const commentContents = [
    {
      actionTitle: Strings.REPORT_REASON_HARASSMENT_COMMENT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.HARASSMENT_COMMENT),
    },
    {
      actionTitle: Strings.REPORT_REASON_CHILDABUSE_COMMENT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.CHILDABUSE_COMMENT),
    },
    {
      actionTitle: Strings.REPORT_REASON_SPAM_COMMENT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.SPAM_COMMENT),
    },
    {
      actionTitle: Strings.REPORT_REASON_VIOLENT_COMMENT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.VIOLENT_COMMENT),
    },
    {
      actionTitle: Strings.REPORT_REASON_MALICIOUS_COMMENT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.MALICIOUS_COMMENT),
    },
    {
      actionTitle: Strings.REPORT_REASON_HARASSMENT_COMMENT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.HARASSMENT_COMMENT),
    },
    {
      actionTitle: Strings.REPORT_REASON_INJURIOUS_COMMENT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.INJURIOUS_COMMENT),
    },
    {
      actionTitle: Strings.REPORT_REASON_INVALID_COMMENT,
      onAction: () => handleAction(Codes.REPORT_REASON_CODE.INVALID_COMMENT),
    },
  ];

  if (contentInfo.type === 'video') {
    title = Strings.REPORT_MODAL_TITLE_REVIEW;
    contents = reviewContents;
  } else if (contentInfo.type === 'product') {
    title = Strings.REPORT_MODAL_TITLE_PRODUCT;
    contents = productContents;
  } else if (contentInfo.type === 'user') {
    title = Strings.REPORT_MODAL_TITLE_USER;
    contents = userContents;
  } else if (contentInfo.type === 'comment') {
    title = Strings.REPORT_MODAL_TITLE_COMMENT;
    contents = commentContents;
  } else {
    title = title = Strings.REPORT_MODAL_TITLE_GENERAL;
  }

  return (
    <>
      <Toast
        ref={toastRef}
        fadeInDuration={100}
        fadeOutDuration={1900}
        position={'top'}
        style={{
          backgroundColor: Constants.COLOR_BACKGROUND_DARK,
          borderRadius: 20,
          paddingHorizontal: 20,
          bottom: getStatusBarHeight(),
        }}
        opacity={0.9}
      />
      <SelectionModal
        title={title}
        visible={visible}
        deemed={true}
        onCancel={onCancel}
        contents={contents}
      />
    </>
  );
};

export default ReportModal;
