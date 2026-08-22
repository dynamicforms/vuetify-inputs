import { describe, expect, it } from 'vitest';

import { stripWordArtifacts } from './word-paste';

// A representative fragment of what Microsoft Word puts on the clipboard: conditional comments, an <xml>
// metadata block, mso-* styles mixed in with real ones, Mso*-prefixed classes, namespaced tags, and a table.
const WORD_HTML = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<style>p.MsoNormal { margin: 0; }</style>
<xml><o:DocumentProperties><o:Author>Jure</o:Author></o:DocumentProperties></xml>
</head>
<body>
<!--[if gte mso 9]><xml><o:shapedefaults v:ext="edit" spidmax="1026"/></xml><![endif]-->
<p class="MsoNormal" lang="EN-US" style="mso-margin-top-alt:auto"><o:p>&nbsp;</o:p></p>
<h1 style="mso-outline-level:1">Quarterly Report</h1>
<p class="MsoNormal">This is <span style="mso-bidi-font-weight:bold; font-weight:bold">bold text</span> and
<span style="font-style:italic">italic text</span>.</p>
<table class="MsoTableGrid" border="1" style="mso-table-lspace:0pt">
<tr><td style="mso-border-alt:solid windowtext .5pt">Cell A</td><td>Cell B</td></tr>
</table>
</body>
</html>
`;

describe('stripWordArtifacts', () => {
  it('drops conditional comments, xml metadata, and namespaced tags', () => {
    const result = stripWordArtifacts(WORD_HTML);

    expect(result).not.toContain('<!--');
    expect(result).not.toContain('<xml>');
    expect(result.toLowerCase()).not.toContain('<o:p');
    expect(result.toLowerCase()).not.toContain('o:documentproperties');
  });

  it('strips head-only style/meta blocks', () => {
    const result = stripWordArtifacts(WORD_HTML);

    expect(result).not.toContain('MsoNormal { margin');
  });

  it('strips mso-* style properties while keeping real ones', () => {
    const result = stripWordArtifacts(WORD_HTML);

    expect(result).not.toMatch(/mso-[a-z-]+\s*:/);
    expect(result).toContain('font-weight:bold');
    expect(result).toContain('font-style:italic');
  });

  it('strips Mso*-prefixed classes and lang/id/align attributes', () => {
    const result = stripWordArtifacts(WORD_HTML);

    expect(result).not.toContain('MsoNormal');
    expect(result).not.toContain('MsoTableGrid');
    expect(result).not.toContain('lang=');
  });

  it('keeps the real heading and table structure intact', () => {
    const result = stripWordArtifacts(WORD_HTML);

    expect(result).toContain('<h1');
    expect(result).toContain('Quarterly Report');
    expect(result).toContain('<table');
    expect(result).toContain('<td');
    expect(result).toContain('Cell A');
    expect(result).toContain('Cell B');
  });

  it('unwraps attribute-less spans left over once mso styling is stripped', () => {
    const result = stripWordArtifacts('<p><span style="mso-fareast-font-family:Calibri">plain run</span></p>');

    expect(result).not.toContain('<span');
    expect(result).toContain('plain run');
  });

  it('passes non-Word HTML through unchanged in substance', () => {
    const result = stripWordArtifacts('<p>Hello <strong>world</strong></p>');

    expect(result).toContain('<p>Hello <strong>world</strong></p>');
  });

  it('returns the input as-is for empty content', () => {
    expect(stripWordArtifacts('')).toBe('');
  });

  it('strips background/background-color/bgcolor shading while keeping foreground color', () => {
    const result = stripWordArtifacts(
      '<table><tr>' +
        '<td style="background:black;color:red;mso-background-themecolor:text1">Cell A</td>' +
        '<td style="background-color:#000000" bgcolor="black">Cell B</td>' +
        '</tr></table>',
    );

    expect(result).not.toMatch(/background(?:-color)?\s*:/);
    expect(result).not.toContain('bgcolor');
    expect(result).toContain('color:red');
    expect(result).toContain('Cell A');
    expect(result).toContain('Cell B');
  });
});
