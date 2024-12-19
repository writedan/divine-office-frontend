import { View, Text } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as exsurge from 'exsurge';

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
  <View style={{ 
    borderWidth: 1, 
    borderColor: '#d1c7b7', 
    padding: 12, 
    marginVertical: 10, 
    borderRadius: 8, 
    backgroundColor: '#f4efe4'
  }}>
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

const DOMusic = ({ value }) => {
	const element = useRef(null);

	useEffect(() => {
		function parseHeaders(lines) {
	        const headerLines = lines.split('%%')[0].split('\n');
	        const headerObject = {};

	        for (let line of headerLines) {
	            line = line.trim();
	            if (line !== '') {
	                let [key, value] = line.split(':').map(part => part.trim());
	                value = value.substring(0, value.length - 1)
	                if (headerObject.hasOwnProperty(key)) {
	                    if (Array.isArray(headerObject[key])) {
	                        headerObject[key].push(value);
	                    } else {
	                        headerObject[key] = [headerObject[key], value];
	                    }
	                } else {
	                    headerObject[key] = value;
	                }
	            }
	        }

	        return headerObject;
	    };

		const factor = 1.15;
		const ctx = new exsurge.ChantContext();
		const fontSize = 16;
		const scaleFactor = (ctx.glyphScaling * fontSize * factor) / ctx.textStyles.lyric.size;

		ctx.setFont("serif", (fontSize * factor));
		ctx.markupSymbolDictionary['^'] = 'c';
	    ctx.textStyles.al.prefix = '<b>';
	    ctx.textStyles.annotation.size = fontSize;
	    ctx.textStyles.annotation.color = 'red';

	    const music = value.split("%%");
	    const headers = parseHeaders(music[0]);
	    let gabc = music[1].replace(/(<b>[^<]+)<sp>'(?:oe|œ)<\/sp>/g,'$1œ</b>\u0301<b>')
	        .replaceAll('<sp>v</sp>', '<v>\\Vbar</v>')
	        .replaceAll('<sp>r</sp>', '<v>\\Rbar</v>')
	        .replaceAll('<sp>a</sp>', '<v>\\Abar</v>')
	        .replaceAll('<sp>*</sp>', '<v>\\greheightstar</v>')
	        .replaceAll('<sp>1</sp>', "<c>†</c>")
	        .replaceAll('<sp>2</sp>', "<c>✢</c>")
	        .replaceAll('<sp>3</sp>', '<c>‡</c>')
	        .replaceAll('<sp>4</sp>', '<c>‡‡</c>')
	        .replaceAll('<sp>+</sp>', '<c>✠</c>')
		    .replaceAll(/<v>\\([VRAvra])bar<\/v>/g,'$1/.')
	        .replaceAll(/<sp>([VRAvra])\/<\/sp>\.?/g,'$1/.')
	        .replaceAll(/<b><\/b>/g,'')
	        .replaceAll(/<sp>'(?:ae|æ)<\/sp>/g,'ǽ')
	        .replaceAll(/<sp>'(?:oe|œ)<\/sp>/g,'œ́')
	        .replaceAll(/<v>\\greheightstar<\/v>/g,'*')
	        .replaceAll(/<\/?sc>/g,'%')
	        .replaceAll(/<\/?b>/g,'*')
	        .replaceAll(/<\/?i>/g,'_')
	        .replaceAll(/(\s)_([^\s*]+)_(\(\))?(\s)/g,"$1^_$2_^$3$4")
	        .replaceAll(/(\([cf][1-4]\)|\s)(\d+\.)(\s\S)/g,"$1^$2^$3");

	    ctx.defaultLanguage = (headers['centering-scheme'] == 'english') ? new exsurge.English : new exsurge.Latin;

	    const mappings = exsurge.Gabc.createMappingsFromSource(ctx, gabc);
	    const score = new exsurge.ChantScore(ctx, mappings, headers['initial-style'] == '1');
	    if (headers['initial-style'] == '1') {
	        if (headers['annotation']) {
	            const a = [headers['annotation']].flat();
	            score.annotation = new exsurge.Annotations(ctx, ...a);
	        }
	    }

	    score.updateNotations(ctx);

	    score.performLayoutAsync(ctx, async function(){
	        await score.layoutChantLines(ctx, 1000, async function(){
	            let svg = await score.createSvgNode(ctx);
	            let extraMargin = false;
	            let toChange = [];
	            for (let e of svg.getElementsByClassName('aboveLinesText')) {
	                toChange.push(e);
	                if (e.textContent.startsWith("$")) {
	                    extraMargin = true;
	                    element.classList.add("extra-margin");
	                }
	            }

	            for (let e of toChange) {
	                let offset = (((e.textContent == '$~') ? 15 : 20) / (16 * 1.25)) * (fontSize * factor);

	                if (e.textContent.startsWith("$")) {
	                    e.setAttribute('y', parseFloat(e.getAttribute('y')) + offset)
	                    if (e.textContent == '$') {
	                        e.textContent = '^';
	                        e.style.fontWeight = 'bold';
	                    }
	                    e.textContent = e.textContent.replace("$","");
	                } else {
	                    e.children[0].style.fontWeight = "normal";
	                    e.children[0].style.fontSize = "75%";
	                    if (!extraMargin) {
	                        e.setAttribute('y', parseFloat(e.getAttribute('y')) + offset);
	                        element.classList.add("reduce-margin");
	                    }

	                }
	            }

	            element.current.appendChild(svg);
	        })
	    });
	}, []);

    return (
    	<div ref={element}></div>
    );
};

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
