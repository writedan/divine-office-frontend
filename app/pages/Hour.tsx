import { View, Text } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as exsurge from 'exsurge';

import AsyncCall from '../components/AsyncCall';
import { useApi } from '../ApiControl';

const SmallPrint = /\{([^{}]*)\}/g;
const Vowel = /([aeiouAEIOU])/g;
const Y = /([yY])/g;
const Intone = /\(([^()]*)\)/g;
const Flex = /\^([^^]*)\^/g;
const Mediant = /\~([^~]*)\~/g;
const Accent = /\`([^`]*)\`/g;

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
      <View style={{ flex: 1, padding: 16, width: '50%', marginLeft: '25%' }}>
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

const DOText = ({ value }) => {
    const styles = {
        italic: {
            fontStyle: 'italic',
            fontWeight: 'normal'
        },
        bold: {
            fontStyle: 'normal',
            fontWeight: 'bold'
        },
        underline: {
            textDecorationLine: 'underline'
        },
        asterisk: {
            color: 'red',
            fontWeight: 'bold'
        },
        smallPrint: {
            fontSize: 14,
            color: 'red'
        },
        container: {
            marginVertical: 6,
            fontSize: 18,
            color: '#4a3c31',
            fontFamily: 'serif'
        }
    };

    function styleFirstVowel(text, sym, style) {
        const match = text.match(Vowel) || text.match(Y);
        if (!match) return text;
        const firstVowelIndex = text.indexOf(match[0]);
        const before = text.slice(0, firstVowelIndex);
        const vowel = match[0];
        const after = text.slice(firstVowelIndex + 1);
        return (
            <Text style={style}>
                {before}
                <Text>
                    {vowel}{sym}
                </Text>
                {after}
            </Text>
        );
    }

    function transformText(inputText) {
        let elements = [];
        inputText.split(/(\*|\+\+\+|\+|\{[^{}]*\}|\([^()]*\)|\^[^^]*\^|~[^~]*~|`[^`]*`)/).forEach((chunk, index) => {
            if (chunk === "*") {
                elements.push(
                    <Text key={index} style={styles.asterisk}>
                        *
                    </Text>
                );
                elements.push('\n    ');
            } else if (chunk === "+++") {
                elements.push(
                    <Text key={index} style={styles.asterisk}>
                        ✠
                    </Text>
                );
            } else if (chunk === "+") {
                elements.push(
                    <Text key={index} style={styles.asterisk}>
                        +
                    </Text>
                );
                elements.push('\n');
            } else if (SmallPrint.test(chunk)) {
                elements.push(
                    <Text key={index} style={styles.smallPrint}>
                        {chunk.replace(SmallPrint, '$1')}
                    </Text>
                );
            } else if (Intone.test(chunk)) {
                const group = chunk.replace(Intone, '$1');
                elements.push(<Text key={index}>{styleFirstVowel(group, "\u030A", styles.underline)}</Text>);
            } else if (Flex.test(chunk)) {
                const group = chunk.replace(Flex, '$1');
                elements.push(<Text key={index}>{styleFirstVowel(group, "\u0302", styles.italic)}</Text>);
            } else if (Mediant.test(chunk)) {
                const group = chunk.replace(Mediant, '$1');
                elements.push(<Text key={index}>{styleFirstVowel(group, "\u0303", styles.underline)}</Text>);
            } else if (Accent.test(chunk)) {
                const group = chunk.replace(Accent, '$1');
                elements.push(<Text key={index}>{styleFirstVowel(group, "\u0301", styles.bold)}</Text>);
            } else {
                elements.push(chunk);
            }
        });
        return elements;
    }

    return (
        <Text style={styles.container}>
            {transformText(value)}
        </Text>
    );
};

const DOHeading = ({ text, level }) => {
  const styles = {
    h1: { fontSize: 36, fontWeight: 'bold', marginVertical: 12, color: '#4a3c31', fontFamily: 'serif' },
    h2: { fontSize: 32, fontWeight: 'bold', marginVertical: 10, color: '#4a3c31', fontFamily: 'serif' },
    h3: { fontSize: 28, fontWeight: 'bold', marginVertical: 8, color: '#4a3c31', fontFamily: 'serif' },
    default: { fontSize: 24, fontWeight: 'normal', marginVertical: 6, color: '#4a3c31', fontFamily: 'serif' },
  };

  const headingStyle = styles[`h${level}`] || styles.default;

  return (
    <View>
      <Text style={[headingStyle, { textAlign: 'center' }]}>{text}</Text>
    </View>
  );
};

const DOInstruction = ({ value }) => (
  <Text style={{ color: '#b22222', marginVertical: 6, fontSize: 18, fontStyle: 'italic', fontFamily: 'serif' }}>{value}</Text>
);

const DOMusic = ({ value }) => {
	const element = useRef(null);
	const [totalWidth, setTotalWidth] = useState(0);

	useEffect(() => {
		if (!element.current) return;
		element.current.innerHTML = '';

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
		const fontSize = 20;
		const scaleFactor = (ctx.glyphScaling * fontSize * factor) / ctx.textStyles.lyric.size;
		ctx.glyphScaling = ctx.glyphScaling * 1.33;

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
	    element.current.innerHTML = '';

	    score.performLayoutAsync(ctx, async function(){
	        await score.layoutChantLines(ctx, totalWidth, async function(){
	            let svg = await score.createSvgNode(ctx);
	            let extraMargin = false;
	            let toChange = [];
	            for (let e of svg.getElementsByClassName('aboveLinesText')) {
	                toChange.push(e);
	                if (e.textContent.startsWith("$")) {
	                    extraMargin = true;
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
	                    }

	                }
	            }

	            element.current.innerHTML = '';
	            element.current.appendChild(svg);
	        });
	    });

	    return () => {
        if (element.current) {
            element.current.innerHTML = '';
        }
    	};
	}, [totalWidth]);

  return (
  	<View onLayout={(e) => setTotalWidth(e.nativeEvent.layout.width)}>
  		<div ref={element}></div>
  	</View>
  );
};

const DOTitle = ({ value }) => (
  <View style={{ marginVertical: 10 }}>
    <Text style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 20, color: '#4a3c31', fontFamily: 'serif' }}>
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
    <Text style={{ color: '#b22222', fontWeight: 'bold', fontSize: 18, fontFamily: 'serif' }}>{value}</Text>
  </View>
);

export default Hour;