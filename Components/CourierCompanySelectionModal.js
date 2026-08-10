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
      actionTitle: Strings.COURIER_CJ,
      onAction: () => handleAction(Strings.COURIER_CJ),
    },
    {
      actionTitle: Strings.COURIER_HANJIN,
      onAction: () => handleAction(Strings.COURIER_HANJIN),
    },
    {
      actionTitle: Strings.COURIER_LOTTE,
      onAction: () => handleAction(Strings.COURIER_LOTTE),
    },
    {
      actionTitle: Strings.COURIER_EPOST,
      onAction: () => handleAction(Strings.COURIER_EPOST),
    },
    {
      actionTitle: Strings.COURIER_LOGEN,
      onAction: () => handleAction(Strings.COURIER_LOGEN),
    },
    {
      actionTitle: Strings.COURIER_CU,
      onAction: () => handleAction(Strings.COURIER_CU),
    },
    {
      actionTitle: Strings.COURIER_GS,
      onAction: () => handleAction(Strings.COURIER_GS),
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
