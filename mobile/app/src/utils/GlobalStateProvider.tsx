import React, {createContext, useContext, useState} from 'react';

const GlobalStateContext: React.Context<any> = createContext(null);
export const useGlobalState = () => useContext(GlobalStateContext);

interface GlobalStateProviderProps {
  children: React.ReactNode;
}

export const GlobalStateProvider = ({children}: GlobalStateProviderProps) => {
  const [payPalSheetDismissable, setPayPalSheetDismissable] = useState(true);
  const [editable, setEditable] = useState(false);
  const [priceReductionBannerVisible, setPriceReductionBannerVisible] =
    useState(false);
  const [priceReductionBannerText, setPriceReductionBannerText] = useState('');
  const [
    priceReductionAcceptedBannerVisible,
    setPriceReductionAcceptedBannerVisible,
  ] = useState(false);

  return (
    <GlobalStateContext.Provider
      value={{
        payPalSheetDismissable,
        setPayPalSheetDismissable,
        editable,
        setEditable,
        priceReductionBannerVisible,
        setPriceReductionBannerVisible,
        priceReductionBannerText,
        setPriceReductionBannerText,
        priceReductionAcceptedBannerVisible,
        setPriceReductionAcceptedBannerVisible,
      }}>
      {children}
    </GlobalStateContext.Provider>
  );
};
