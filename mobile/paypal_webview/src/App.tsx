/* A tiny React app for paying with PayPal, used in `mobile/app/src/components/search/BookWithPayPal.tsx`*/
import {PayPalButtons, PayPalScriptProvider} from '@paypal/react-paypal-js';
import axios, {AxiosError} from 'axios';
import React, {useEffect, useState} from 'react';
import ActivityIndicator from './components/ActivityIndicator';
import VerticallyCenteringView from './components/VerticallyCenteringView';
import {config} from './Config';

function App() {
  const initialOptions = {
    clientId: config.paypalClientId,
    currency: 'EUR',
    components: 'buttons',
  };

  const [spotId, setSpotId] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);

  const messageToNative = (message: string) => {
    // @ts-ignore
    if (window.ReactNativeWebView) {
      // @ts-ignore
      window.ReactNativeWebView.postMessage(message);
    } else {
      setErr(true);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.spotId) {
        setSpotId(data.spotId);
        setTransactionId(data.transactionId);
        setIdToken(data.idToken);
        console.log('Data from React Native:', data);
      }
    };

    window.addEventListener('message', handleMessage);
    messageToNative('ready');
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const request = async (method: string, data: object) => {
    const url = get_url(method);
    const headers = {
      Authorization: `Bearer ${idToken}`,
    };
    try {
      const response = await axios.post(url, data, {headers});
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.data) {
        throw Error(axiosError.response.data as string);
      } else {
        throw error;
      }
    }
  };

  function get_url(method: string) {
    if (config.remoteBackend) {
      const method_name = method.replace(/_/g, '-');
      return config.baseUrl.replace('method_name', method_name);
    } else {
      return `${config.baseUrl}/${method}`;
    }
  }

  const createOrder = async () => {
    try {
      const {id} = await request('paypal_create_order', {
        transactionId,
      });
      if (id) {
        return id;
      } else {
        messageToNative('ff_error/paypal_create_order');
        console.error('No order ID received');
      }
    } catch (error) {
      messageToNative('ff_error/paypal_create_order');
      console.error(error);
    }
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      messageToNative('approved');
      await request('paypal_book_spot', {
        spotId,
        transactionId,
        orderId: data.orderID,
      });
      messageToNative('success');
    } catch (error) {
      const httpError = error as Error;
      if (httpError.message.startsWith('ff_error/')) {
        messageToNative(httpError.message);
      } else {
        messageToNative('ff_error/paypal_book_spot');
      }
      console.error(error);
    }
  };

  if (err) {
    return (
      <VerticallyCenteringView>
        <p>An error occurred. Please try again later.</p>
      </VerticallyCenteringView>
    );
  }

  if (!spotId || !transactionId || !idToken) {
    return <ActivityIndicator />;
  }

  return (
    <div className="App">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '95vh',
          marginLeft: 25,
          marginRight: 25,
        }}>
        <p style={{marginTop: 20, fontSize: 22}}>Continue with PayPal</p>
        {loading && <ActivityIndicator />}
        <div style={{marginBottom: 30, minHeight: 60}}>
          <PayPalScriptProvider options={initialOptions}>
            <PayPalButtons
              fundingSource="paypal"
              createOrder={createOrder}
              onApprove={onApprove}
              onInit={() => setLoading(false)}
            />
          </PayPalScriptProvider>
        </div>
      </div>
    </div>
  );
}

export default App;
