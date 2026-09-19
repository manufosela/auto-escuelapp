import { XMLParser } from 'fast-xml-parser';
import { describe, expect, it } from 'vitest';
import { boeDateToISO, flattenTable, flattenText } from './fetch-legal.mjs';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	isArray: (name) => name === 'p' || name === 'table' || name === 'tr',
});

describe('boeDateToISO', () => {
	it('convierte una fecha BOE a ISO', () => {
		expect(boeDateToISO('20040123')).toBe('2004-01-23');
	});

	it('lanza un error con un formato inesperado', () => {
		expect(() => boeDateToISO('2004-01-23')).toThrow(/formato inesperado/);
	});
});

describe('flattenText', () => {
	it('aplana un párrafo simple a su texto', () => {
		const parsed = parser.parse('<p class="articulo">Artículo 48. Título.</p>');
		expect(flattenText(parsed.p)).toBe('Artículo 48. Título.');
	});

	it('ignora los atributos al aplanar', () => {
		const parsed = parser.parse('<p class="x" id="y">Texto</p>');
		expect(flattenText(parsed.p)).toBe('Texto');
	});
});

describe('flattenTable', () => {
	// Fixture: misma forma que la tabla real del art. 48 RGC (velocidades
	// máximas por tipo de vía y vehículo), la que se perdía por completo
	// antes de este fix porque <table> no va dentro de <p>.
	const TABLE_XML = `
		<table class="tabla_b_sica" summary="Tabla de datos">
			<thead>
				<tr>
					<td> </td>
					<th><p class="cabeza_tabla">Turismos</p></th>
					<th><p class="cabeza_tabla">Camiones</p></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><p class="cuerpo_tabla_izq">Autopista y autovía</p></td>
					<td><p class="cuerpo_tabla_centro">120</p></td>
					<td><p class="cuerpo_tabla_centro">90</p></td>
				</tr>
				<tr>
					<td><p class="cuerpo_tabla_izq">Convencional</p></td>
					<td><p class="cuerpo_tabla_centro">90</p></td>
					<td><p class="cuerpo_tabla_centro">80</p></td>
				</tr>
			</tbody>
		</table>
	`;

	it('aplana cabecera y cuerpo fila a fila, con la celda de esquina en blanco descartada', () => {
		const parsed = parser.parse(TABLE_XML);
		const text = flattenTable(parsed.table[0]);
		expect(text).toBe(
			['Turismos | Camiones', 'Autopista y autovía | 120 | 90', 'Convencional | 90 | 80'].join('\n'),
		);
	});

	it('devuelve una cadena vacía para una tabla sin filas', () => {
		const parsed = parser.parse('<table><thead></thead><tbody></tbody></table>');
		expect(flattenTable(parsed.table[0])).toBe('');
	});
});
