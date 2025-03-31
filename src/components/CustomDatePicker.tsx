import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomDatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  label?: string;
  minimumDate?: Date;
  disabled?: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  date,
  onDateChange,
  label = 'Fecha',
  minimumDate,
  disabled = false
}) => {
  const [show, setShow] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    onDateChange(currentDate);
  };

  const showDatepicker = () => {
    if (!disabled) {
      setShow(true);
    }
  };

  // Versión web alternativa usando input nativo
  if (Platform.OS === 'web') {
    return (
      <View className="mb-4">
        {label && <Text className="text-gray-700 mb-1">{label}</Text>}
        <input
          type="date"
          value={format(date, 'yyyy-MM-dd')}
          onChange={(e) => {
            // Convertir el valor del input a objeto Date
            if (e.target.value) {
              onDateChange(new Date(e.target.value));
            }
          }}
          className="border border-gray-300 rounded p-2 w-full"
          min={minimumDate ? format(minimumDate, 'yyyy-MM-dd') : undefined}
          disabled={disabled}
          style={{
            backgroundColor: disabled ? '#f0f0f0' : 'white',
            color: disabled ? '#888' : 'black',
          }}
        />
      </View>
    );
  }

  // Versión nativa para iOS/Android
  return (
    <View className="mb-4">
      {label && <Text className="text-gray-700 mb-1">{label}</Text>}
      <TouchableOpacity 
        onPress={showDatepicker}
        className={`border border-gray-300 rounded p-2 ${disabled ? 'bg-gray-100' : 'bg-white'}`}
        disabled={disabled}
      >
        <Text className={`${disabled ? 'text-gray-500' : 'text-gray-800'}`}>
          {format(date, 'dd/MM/yyyy', { locale: es })}
        </Text>
      </TouchableOpacity>
      
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onChange}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
};

export default CustomDatePicker;
