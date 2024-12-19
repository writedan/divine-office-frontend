import { View, Text } from 'react-native';
import { useState } from 'react';

import AsyncCall from '../components/AsyncCall';
import { useApi } from '../ApiControl';

const Hour = ({ date, hour }) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [elements, setElements] = useState([]);
  const { getElements } = useApi();

  const load = async () => {
    setElements(await getElements(date, hour));
  };

  const convertElements = (elements) =>
    elements.map((e, index) => (
      <View key={index} style={{ marginBottom: 8 }}>
        {convertElement(e)}
      </View>
    ));

  const convertElement = (element) => {
    const [type, value] = Object.entries(element)[0];
    console.log(type, value);
    switch (type) {
      case 'Box':
        return <DOBox>{convertElements(value)}</DOBox>;
      case 'Text':
        return <DOText value={value} />;
      case 'Heading':
        return <DOHeading text={value[0]} level={value[1]} />;
      case 'Instruction':
        return <DOInstruction value={value} />;
      case 'RawGabc':
        return <DOMusic value={value} />;
      case 'Title':
        return <DOTitle value={value} />;
      case 'Error':
        return <DOError value={value} />;
      default:
        return null;
    }
  };

  return (
    <AsyncCall call={load} message={"Loading liturgy"} key={reloadKey}>
      <View style={{ flex: 1, padding: 16 }}>
        {convertElements(elements)}
      </View>
    </AsyncCall>
  );
};

const DOBox = ({ children }) => (
  <View style={{ borderWidth: 1, borderColor: '#d1c7b7', padding: 12, marginVertical: 10, borderRadius: 8, backgroundColor: '#f8f5ec' }}>
    {children}
  </View>
);

const DOText = ({ value }) => (
  <Text style={{ marginVertical: 6, fontSize: 16, color: '#4a3c31', fontFamily: 'serif' }}>{value}</Text>
);

const DOHeading = ({ text, level }) => {
  const styles = {
    h1: { fontSize: 32, fontWeight: 'bold', marginVertical: 12, color: '#4a3c31', fontFamily: 'serif' },
    h2: { fontSize: 28, fontWeight: 'bold', marginVertical: 10, color: '#4a3c31', fontFamily: 'serif' },
    h3: { fontSize: 24, fontWeight: 'bold', marginVertical: 8, color: '#4a3c31', fontFamily: 'serif' },
    default: { fontSize: 20, fontWeight: 'normal', marginVertical: 6, color: '#4a3c31', fontFamily: 'serif' },
  };

  const headingStyle = styles[`h${level}`] || styles.default;

  return (
    <View>
      <Text style={[headingStyle, { textAlign: 'center' }]}>{text}</Text>
    </View>
  );
};

const DOInstruction = ({ value }) => (
  <Text style={{ color: '#b22222', marginVertical: 6, fontSize: 16, fontStyle: 'italic', fontFamily: 'serif' }}>{value}</Text>
);

const DOMusic = ({ value }) => (
  <Text style={{ marginVertical: 6, fontSize: 16, fontFamily: 'serif', color: '#4a3c31' }}>{value}</Text>
);

const DOTitle = ({ value }) => (
  <View style={{ marginVertical: 10 }}>
    <Text style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 18, color: '#4a3c31', fontFamily: 'serif' }}>
      {value}
      {!value.endsWith('.') && '.'}
    </Text>
  </View>
);

const DOError = ({ value }) => (
  <View
    style={{
      borderWidth: 1,
      borderRadius: 8,
      borderColor: '#b22222',
      backgroundColor: '#ffe6e6',
      padding: 12,
      marginVertical: 10,
    }}
  >
    <Text style={{ color: '#b22222', fontWeight: 'bold', fontSize: 16, fontFamily: 'serif' }}>{value}</Text>
  </View>
);


export default Hour;
