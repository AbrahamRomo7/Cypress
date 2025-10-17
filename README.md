# Pruebas E2E – Flujo de Compra Demoblaze
<img width="330" height="236" alt="image" src="https://github.com/user-attachments/assets/2a279aec-de07-41b0-8eea-444c80d16a9f" />

Este proyecto automatiza pruebas **End-to-End** del flujo de compra en la tienda de
demostración [Demoblaze](https://www.demoblaze.com/) utilizando **Cypress.io**.
Se incluyen escenarios exitosos y fallidos, validando tanto el carrito como la información de pago.

## Tecnologías y herramientas

- Cypress.io – automatización de pruebas E2E
- Node.js – entorno de ejecución de Cypress
- JavaScript (ES6)
- Git / GitHub – control de versiones

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/ARjava7/cypress.git
cd cypress
2. Instalar dependencias
npm install
npm install cypress --save-dev
3. Abrir cypress (GUI)
npx cypress open
4. Click en cada archivo ubicado dentro de demoblaze/compra para ejecutar cada prueba

###Configuración destacada
- baseUrl: &#39;https://www.demoblaze.com&#39; – permite usar cy.visit(&#39;/&#39;)
Permite cambiar de entorno modificando únicamente el .conf
- retries:
 runMode: 2
 openMode: 1
Permite repetir la ejecución en caso de caerse para evitar falsos negativos
###Escenarios de prueba

1. Compra con carrito vacío

2. Compra con 2 productos y campo nombre vacío

3. Compra con 2 productos y campos mes/año vacíos

4. Compra con 2 productos y tarjeta con letras

5. Compra con 3 productos y eliminación de 1

6. Compra con 2 productos y datos válidos
```
#Conclusiones las encontramos aquí

<img width="319" height="153" alt="image" src="https://github.com/user-attachments/assets/ab319645-ffd8-4f8f-9665-76fe1828c635" />
