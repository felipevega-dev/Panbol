import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenProps } from '../../navigation/types';

type Props = ProfileScreenProps<'Help'>;

interface FAQ {
  question: string;
  answer: string;
  expanded: boolean;
}

const HelpScreen: React.FC<Props> = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      question: '¿Cómo creo un nuevo pedido?',
      answer: 'Para crear un nuevo pedido, dirígete a la pestaña "Crear Pedido" en la barra inferior. Allí podrás seleccionar los productos que deseas, indicar la fecha de entrega y agregar observaciones si es necesario.',
      expanded: false
    },
    {
      question: '¿Puedo editar un pedido después de crearlo?',
      answer: 'Sí, puedes editar un pedido siempre y cuando lo hagas el mismo día antes de las 20:00 horas. Para editar un pedido, ve a la lista de pedidos, selecciona el pedido que deseas modificar y toca el botón "Editar".',
      expanded: false
    },
    {
      question: '¿Cómo puedo cambiar el estado de un pedido?',
      answer: 'Para cambiar el estado de un pedido, accede al detalle del pedido y presiona el botón "Cambiar Estado". Podrás elegir entre los estados disponibles: Pendiente, Entregado o Cancelado.',
      expanded: false
    },
    {
      question: '¿Puedo exportar la información de mis pedidos?',
      answer: 'Sí, desde la pantalla de detalle de un pedido, puedes presionar el botón "Exportar" y elegir si deseas exportar a Excel o PDF. El archivo se guardará en tu dispositivo.',
      expanded: false
    },
    {
      question: '¿Es posible programar un pedido para una fecha específica?',
      answer: 'Sí, al crear o editar un pedido puedes seleccionar la fecha de entrega deseada utilizando el calendario que aparece en la pantalla.',
      expanded: false
    }
  ]);
  
  const toggleFaq = (index: number) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index].expanded = !updatedFaqs[index].expanded;
    setFaqs(updatedFaqs);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:soporte@panbol.com?subject=Ayuda%20con%20la%20aplicación');
  };
  
  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-4">Preguntas Frecuentes</Text>
        
        {faqs.map((faq, index) => (
          <View key={index} className="bg-white rounded-lg shadow-sm mb-3">
            <TouchableOpacity 
              className="p-4 flex-row items-center justify-between"
              onPress={() => toggleFaq(index)}
            >
              <Text className="text-gray-800 font-medium flex-1 pr-2">{faq.question}</Text>
              <Ionicons 
                name={faq.expanded ? "chevron-up-outline" : "chevron-down-outline"} 
                size={22} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
            
            {faq.expanded && (
              <View className="p-4 pt-0 border-t border-gray-100">
                <Text className="text-gray-600">{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
        
        <Text className="text-lg font-bold text-gray-800 mb-4 mt-4">Soporte</Text>
        
        <View className="bg-white rounded-lg shadow-sm mb-4">
          <TouchableOpacity 
            className="p-4 border-b border-gray-200 flex-row items-center"
            onPress={handleContactSupport}
          >
            <Ionicons name="mail-outline" size={22} color="#3B82F6" className="mr-3" />
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">Contactar Soporte</Text>
              <Text className="text-gray-500 text-sm">Envíanos un correo electrónico</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity className="p-4 flex-row items-center">
            <Ionicons name="call-outline" size={22} color="#3B82F6" className="mr-3" />
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">Llamar a Soporte</Text>
              <Text className="text-gray-500 text-sm">Lunes a Viernes, 9:00 - 18:00</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        
        <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <Text className="text-gray-800 font-medium mb-2">Versión de la Aplicación</Text>
          <Text className="text-gray-500">Panbol App v1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default HelpScreen; 