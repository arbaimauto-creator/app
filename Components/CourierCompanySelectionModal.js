import React from 'react';

import { GridButtonSelectionModal } from './Views';
import Strings from './Strings';

const CourierCompanySelectionModal = ({ visible, onSelect, onCancel }) => {
  const handleAction = (code) => {
    onSelect(code);
    onCancel();
  };
  const contents = [
    {
      actionTitle: 'CJ대한통운',
      onAction: () => handleAction('CJ대한통운'),
    },
    {
      actionTitle: '한진택배',
      onAction: () => handleAction('한진택배'),
    },
    {
      actionTitle: '롯데택배',
      onAction: () => handleAction('롯데택배'),
    },
    {
      actionTitle: '우체국택배',
      onAction: () => handleAction('우체국택배'),
    },
    {
      actionTitle: '로젠택배',
      onAction: () => handleAction('로젠택배'),
    },
    {
      actionTitle: 'CU 편의점택배',
      onAction: () => handleAction('CU 편의점택배'),
    },
    {
      actionTitle: 'GS Postbox 택배',
      onAction: () => handleAction('GS Postbox 택배'),
    },
    {
      actionTitle: Strings.COURIER_OTHERS,
      onAction: () => handleAction(Strings.COURIER_OTHERS),
    },
  ];

  const title = Strings.COURIER_SELECTION_GUIDE;

  return (
    <GridButtonSelectionModal
      title={title}
      visible={visible}
      deemed={true}
      onCancel={onCancel}
      contents={contents}
    />
  );
};

export default CourierCompanySelectionModal;
