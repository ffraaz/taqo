import React from 'react';
import {TextInput} from 'react-native-paper';

import globalStyles from '../../utils/styles';

interface EmailFormProps {
  inputText: string;
  setInputText: (text: string) => void;
  setIsValid: (valid: boolean) => void;
  textInputRef?: any;
  onContinue: () => void;
}

const EmailForm = ({
  inputText,
  setInputText,
  setIsValid,
  textInputRef,
  onContinue,
}: EmailFormProps) => {
  const validateInput = (text: string) => {
    setIsValid(validateEmail(text));
    setInputText(text);
  };

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  return (
    <TextInput
      ref={textInputRef}
      outlineStyle={globalStyles.textInput}
      keyboardType="email-address"
      mode="outlined"
      value={inputText}
      onChangeText={validateInput}
      placeholder="name@example.com"
      autoCapitalize="none"
      autoFocus={true}
      placeholderTextColor="gray"
      onSubmitEditing={onContinue}
      returnKeyType="done"
    />
  );
};

export default EmailForm;
