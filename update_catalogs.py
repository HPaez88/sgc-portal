import pandas as pd

df = pd.read_excel('C:/Users/hmpl_/OneDrive/Favorites/Escritorio/SGC page/formatos/Cuadro de Control Marzo 2026.xlsx', sheet_name='OOMRSC-05', header=4)
df = df[df['No.'].apply(lambda x: str(x).isdigit() if pd.notna(x) else False)]
df = df[['No.', 'Proceso:', 'Dirección:', 'Área:', 'Indicador o Índice:', 'Periodicidad', 'Unidad de Medida', 'Meta Anual']].copy()
df.columns = ['No', 'Proceso', 'Direccion', 'Area', 'Indicador', 'Periodicidad', 'Unidad', 'Meta']

lines = []
lines.append('export const ORIGENES_AC = ["Auditoría", "Indicador", "Queja", "Otra"];')
lines.append('')
lines.append('export const INDICADORES = [')

for idx, row in df.iterrows():
    no = int(row['No'])
    nombre = row['Indicador'].replace('"', "'").replace('\n', ' ')
    area = row['Area'].replace('"', "'")
    proceso = row['Proceso'].replace('"', "'").replace('\n', ' ')
    direccion = row['Direccion'].replace('"', "'")
    
    meta = row['Meta']
    if pd.isna(meta):
        meta = 0
    else:
        meta = float(meta)
    
    unidad = str(row['Unidad'])
    periodicidad = str(row['Periodicidad'])
    
    es_menor = 'accidente' in row['Indicador'].lower() or 'queja' in row['Indicador'].lower() or 'error' in row['Indicador'].lower()
    
    lines.append(f'  // {no}. {nombre[:60]}...' if len(nombre) > 60 else f'  // {no}. {nombre}')
    lines.append(f'  {{ id: {no}, nombre: "{nombre}", area: "{area}", proceso: "{proceso}", direccion: "{direccion}", meta: {meta}, unidad: "{unidad}", periodicidad: "{periodicidad}", es_menor: {"true" if es_menor else "false"} }},')

lines.append('];')
lines.append('')
lines.append('export const getIndicadoresByArea = (area) => INDICADORES.filter(i => i.area === area);')

with open('C:/Users/hmpl_/OneDrive/Favorites/Escritorio/SGC page/frontend/src/catalogs.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print('Guardados 100 indicadores en catalogs.js')