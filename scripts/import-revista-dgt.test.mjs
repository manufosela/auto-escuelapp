import { describe, expect, it } from 'vitest';
import { guessSubject, parseTestHtml } from './import-revista-dgt.mjs';

const TEST_URL = 'https://revista.dgt.es/es/test/Test-num-999.shtml';

function fixtureArticle({ number, statement, options, correct, extraClass = '' }) {
	return `<article class="test${extraClass}">
		<figure><img src="/Galerias/test/N-999/Test-999-P${number}.jpg" alt="ignorada"/></figure>
		<section class="content_test">
			<h4 class="tit_not">${number}. ${statement}</h4>
			<ul>
				<li><span class="opcion">A.</span> ${options[0]}</li>
				<li><span class="opcion">B.</span> ${options[1]}</li>
				<li><span class="opcion">C.</span> ${options[2]}</li>
			</ul>
			<div class="content_respuesta" data-id="preg${number}">
				<p><strong>Respuesta correcta</strong> <span class="opcion">${correct}</span></p>
			</div>
		</section>
	</article>`;
}

describe('parseTestHtml', () => {
	it('extrae enunciado, opciones e índice de la respuesta correcta', () => {
		const html = fixtureArticle({
			number: 1,
			statement: '¿Puede adelantar aquí?',
			options: ['Sí, siempre.', 'No, nunca.', 'Solo de día.'],
			correct: 'B',
		});
		const [question] = parseTestHtml(html, 999, TEST_URL);
		expect(question.statement).toBe('¿Puede adelantar aquí?');
		expect(question.options).toEqual(['Sí, siempre.', 'No, nunca.', 'Solo de día.']);
		expect(question.correctIndex).toBe(1);
		expect(question.source).toEqual({ type: 'revista-dgt', testNumber: 999, url: TEST_URL });
	});

	it('reconoce el último artículo del test, con clase extra "ultimo"', () => {
		const html = fixtureArticle({
			number: 15,
			statement: 'Última pregunta del test',
			options: ['A.', 'B.', 'C.'],
			correct: 'C',
			extraClass: ' ultimo',
		});
		const [question] = parseTestHtml(html, 999, TEST_URL);
		expect(question.correctIndex).toBe(2);
	});

	it('limpia entidades HTML y espacios repetidos del enunciado', () => {
		const html = fixtureArticle({
			number: 2,
			statement: 'Circula&nbsp;con  remolque;   ¿continúa?',
			options: ['Sí.', 'No.', 'Depende.'],
			correct: 'A',
		});
		const [question] = parseTestHtml(html, 999, TEST_URL);
		expect(question.statement).toBe('Circula con remolque; ¿continúa?');
	});

	it('extrae varias preguntas del mismo test', () => {
		const html = [
			fixtureArticle({ number: 1, statement: 'Primera', options: ['A.', 'B.', 'C.'], correct: 'A' }),
			fixtureArticle({ number: 2, statement: 'Segunda', options: ['A.', 'B.', 'C.'], correct: 'C' }),
		].join('\n');
		const questions = parseTestHtml(html, 999, TEST_URL);
		expect(questions.map((q) => q.number)).toEqual([1, 2]);
	});

	it('nunca incluye la imagen de la pregunta en el resultado', () => {
		const html = fixtureArticle({
			number: 1,
			statement: 'Enunciado',
			options: ['A.', 'B.', 'C.'],
			correct: 'A',
		});
		const [question] = parseTestHtml(html, 999, TEST_URL);
		expect(JSON.stringify(question)).not.toMatch(/\.jpg|Galerias/);
	});

	it('lanza un error (no falla en silencio) si falta la respuesta correcta', () => {
		const malformed = `<article class="test">
			<section class="content_test">
				<h4 class="tit_not">1. Enunciado sin respuesta</h4>
				<ul>
					<li><span class="opcion">A.</span> Uno</li>
					<li><span class="opcion">B.</span> Dos</li>
					<li><span class="opcion">C.</span> Tres</li>
				</ul>
			</section>
		</article>`;
		expect(() => parseTestHtml(malformed, 999, TEST_URL)).toThrow(/respuesta correcta/);
	});

	it('lanza un error si no hay exactamente 3 opciones', () => {
		const malformed = `<article class="test">
			<section class="content_test">
				<h4 class="tit_not">1. Enunciado con dos opciones</h4>
				<ul>
					<li><span class="opcion">A.</span> Uno</li>
					<li><span class="opcion">B.</span> Dos</li>
				</ul>
				<div class="content_respuesta"><p><strong>Respuesta correcta</strong> <span class="opcion">A</span></p></div>
			</section>
		</article>`;
		expect(() => parseTestHtml(malformed, 999, TEST_URL)).toThrow(/3 opciones/);
	});

	it('lanza un error si no hay ninguna pregunta en la página', () => {
		expect(() => parseTestHtml('<html><body>vacío</body></html>', 999, TEST_URL)).toThrow(
			/no se encontró ninguna pregunta/,
		);
	});
});

describe('guessSubject', () => {
	it('reconoce preguntas de velocidad y señalización como materia 1', () => {
		expect(guessSubject('¿A qué velocidad máxima puede circular en esta vía?')).toBe(1);
	});

	it('reconoce preguntas de alcohol/drogas/fatiga como materia 4', () => {
		expect(guessSubject('El consumo de cannabis afecta al comportamiento del conductor')).toBe(4);
	});

	it('reconoce preguntas de usuarios vulnerables como materia 8', () => {
		expect(guessSubject('Un ciclista circula por el arcén')).toBe(8);
	});

	it('devuelve null cuando ninguna palabra clave encaja', () => {
		expect(guessSubject('Frase sin ninguna palabra clave reconocible')).toBeNull();
	});
});
