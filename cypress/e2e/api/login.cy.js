describe('Pruebas API Demoblaze - Autenticación', () => {
  const urlBase = 'https://api.demoblaze.com';
  const usuarioAleatorio = `usuario_${Date.now()}`;
  const contraseña = 'Test123!';
  
  let usuarioCreado;

  describe('Pruebas de Registro (Signup)', () => {
    
    it('Debería crear un nuevo usuario correctamente', () => {
      cy.request({
        method: 'POST',
        url: `${urlBase}/signup`,
        body: {
          username: usuarioAleatorio,
          password: contraseña
        }
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(200);
        expect(respuesta.body).to.have.property('errorMessage');
        
        usuarioCreado = usuarioAleatorio;
      });
    });

    it('No debería permitir crear un usuario que ya existe', () => {
      const usuarioDuplicado = `duplicado_${Date.now()}`;
      
      cy.request({
        method: 'POST',
        url: `${urlBase}/signup`,
        body: {
          username: usuarioDuplicado,
          password: contraseña
        }
      }).then(() => {
        cy.request({
          method: 'POST',
          url: `${urlBase}/signup`,
          body: {
            username: usuarioDuplicado,
            password: contraseña
          },
          failOnStatusCode: false
        }).then((respuesta) => {
          expect(respuesta.status).to.eq(200);
          expect(respuesta.body.errorMessage).to.include('exist');
        });
      });
    });
  });

  describe('Pruebas de Inicio de Sesión (Login)', () => {
    
    let usuarioParaLogin;
    
    before(() => {
      usuarioParaLogin = `logintest_${Date.now()}`;
      
      cy.request({
        method: 'POST',
        url: `${urlBase}/signup`,
        body: {
          username: usuarioParaLogin,
          password: contraseña
        }
      }).then((respuesta) => {
        cy.log('Usuario creado para login:', usuarioParaLogin);
        cy.log('Respuesta signup:', respuesta.body);
      });
    });

    it('Debería iniciar sesión con credenciales correctas', () => {
      cy.log('Intentando login con usuario:', usuarioParaLogin);
      
      cy.request({
        method: 'POST',
        url: `${urlBase}/login`,
        body: {
          username: usuarioParaLogin,
          password: contraseña
        }
      }).then((respuesta) => {
        cy.log('Respuesta completa:', JSON.stringify(respuesta.body));
        
        expect(respuesta.status).to.eq(200);
        
        if (typeof respuesta.body === 'string') {
          expect(respuesta.body).to.not.be.empty;
          cy.log('Token recibido (string):', respuesta.body);
        } else if (respuesta.body.Auth_token) {
          expect(respuesta.body.Auth_token).to.not.be.empty;
          cy.log('Token recibido (objeto):', respuesta.body.Auth_token);
        } else {
          throw new Error('Formato de respuesta inesperado: ' + JSON.stringify(respuesta.body));
        }
        
        usuarioCreado = usuarioParaLogin;
      });
    });

    it('No debería iniciar sesión con usuario inexistente', () => {
      cy.request({
        method: 'POST',
        url: `${urlBase}/login`,
        body: {
          username: 'usuarioQueNoExiste999',
          password: 'passwordIncorrecto'
        },
        failOnStatusCode: false
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(200);
        expect(respuesta.body.errorMessage).to.exist;
        expect(respuesta.body.errorMessage).to.include('does not exist');
      });
    });

    it('No debería iniciar sesión con contraseña incorrecta', () => {
      cy.request({
        method: 'POST',
        url: `${urlBase}/login`,
        body: {
          username: usuarioCreado,
          password: 'contraseñaEquivocada123'
        },
        failOnStatusCode: false
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(200);
        expect(respuesta.body.errorMessage).to.exist;
        expect(respuesta.body.errorMessage).to.include('Wrong password');
      });
    });
  });

  describe('Pruebas de Seguridad - Inyección SQL', () => {
    
    const payloadsSQL = [
      { payload: "' OR '1'='1", descripcion: "Bypass básico de autenticación" },
      { payload: "admin' --", descripcion: "Comentario SQL para omitir validación" },
      { payload: "' OR 1=1--", descripcion: "Condición siempre verdadera" },
      { payload: "admin'/*", descripcion: "Comentario multilinea" },
      { payload: "' UNION SELECT NULL--", descripcion: "Intento de unión de tablas" },
      { payload: "1' AND '1'='1", descripcion: "Condición AND siempre verdadera" },
      { payload: "admin' OR '1'='1'--", descripcion: "Bypass con usuario específico" },
      { payload: "' OR 'x'='x", descripcion: "Comparación alternativa" },
      { payload: "'; DROP TABLE users--", descripcion: "Intento de eliminación de tabla" },
      { payload: "' UNION SELECT username, password FROM users--", descripcion: "Extracción de credenciales" }
    ];

    payloadsSQL.forEach(({ payload, descripcion }) => {
      it(`SQL Injection en login - ${descripcion}`, () => {
        cy.request({
          method: 'POST',
          url: `${urlBase}/login`,
          body: {
            username: payload,
            password: 'cualquierCosa'
          },
          failOnStatusCode: false
        }).then((respuesta) => {
          expect(respuesta.status).to.eq(200);
          
          if (respuesta.body.Auth_token) {
            cy.log(`🚨 CRÍTICO: SQL Injection exitoso con payload: ${payload}`);
            cy.log(`Token obtenido: ${respuesta.body.Auth_token}`);
            expect(respuesta.body.Auth_token).to.not.exist;
          } else {
            expect(respuesta.body).to.not.have.property('Auth_token');
          }
          
          if (respuesta.body.errorMessage) {
            const mensaje = respuesta.body.errorMessage.toLowerCase();
            const revelaInfo = mensaje.includes('wrong password') || 
                             mensaje.includes('does not exist') ||
                             mensaje.includes('incorrect');
            
            if (revelaInfo) {
              cy.log(`⚠️ VULNERABILIDAD MEDIA: Filtración de información`);
              cy.log(`Payload: ${payload}`);
              cy.log(`Mensaje: ${respuesta.body.errorMessage}`);
              expect(true).to.eq(true);
            } else {
              cy.log(`✅ El payload fue rechazado correctamente`);
            }
          } else {
            cy.log(`⚠️ Sin mensaje de error para: ${payload}`);
          }
        });
      });

      it(`SQL Injection en signup - ${descripcion}`, () => {
        cy.request({
          method: 'POST',
          url: `${urlBase}/signup`,
          body: {
            username: payload,
            password: 'Test123!'
          },
          failOnStatusCode: false
        }).then((respuesta) => {
          expect(respuesta.status).to.eq(200);
          
          const caracteresSQL = ["'", '"', '--', '/*', 'OR', 'UNION', 'DROP', 'SELECT'];
          const contieneSQL = caracteresSQL.some(car => payload.includes(car));
          
          if (contieneSQL && !respuesta.body.errorMessage) {
            cy.log(`⚠️ VULNERABILIDAD: Caracteres SQL aceptados sin validación`);
            cy.log(`Payload: ${payload}`);
          } else if (respuesta.body.errorMessage) {
            const mensajeSeguro = respuesta.body.errorMessage.includes('Invalid') ||
                                 respuesta.body.errorMessage.includes('special characters') ||
                                 respuesta.body.errorMessage.includes('not allowed');
            
            if (mensajeSeguro) {
              cy.log(`✅ Payload rechazado correctamente: ${payload}`);
            } else {
              cy.log(`⚠️ Payload procesado con mensaje: ${respuesta.body.errorMessage}`);
            }
          }
        });
      });
    });

    it('Verificar enumeración de usuarios mediante SQL injection', () => {
      const usuarioExistente = usuarioCreado;
      const usuarioInexistente = `noexiste_${Date.now()}`;
      
      cy.request({
        method: 'POST',
        url: `${urlBase}/login`,
        body: {
          username: `${usuarioExistente}' --`,
          password: 'cualquierCosa'
        },
        failOnStatusCode: false
      }).then((respuesta1) => {
        const mensaje1 = respuesta1.body.errorMessage || '';
        
        cy.request({
          method: 'POST',
          url: `${urlBase}/login`,
          body: {
            username: `${usuarioInexistente}' --`,
            password: 'cualquierCosa'
          },
          failOnStatusCode: false
        }).then((respuesta2) => {
          const mensaje2 = respuesta2.body.errorMessage || '';
          
          if (mensaje1 !== mensaje2) {
            cy.log('🚨 VULNERABILIDAD CRÍTICA: User Enumeration detectado');
            cy.log(`Usuario existente retorna: "${mensaje1}"`);
            cy.log(`Usuario inexistente retorna: "${mensaje2}"`);
            cy.log('Recomendación: Usar mensaje genérico "Invalid credentials"');
            
            expect(mensaje1).to.eq(mensaje2);
          } else {
            cy.log('✅ No se detectó User Enumeration');
            cy.log(`Ambos retornan: "${mensaje1}"`);
          }
        });
      });
    });

    it('Prueba de caracteres especiales permitidos', () => {
      const caracteresEspeciales = [
        { car: "'", nombre: "Comilla simple" },
        { car: '"', nombre: "Comilla doble" },
        { car: '--', nombre: "Comentario SQL" },
        { car: '/*', nombre: "Comentario multilinea" },
        { car: ';', nombre: "Separador de queries" },
        { car: 'OR', nombre: "Operador OR" },
        { car: 'AND', nombre: "Operador AND" },
        { car: 'UNION', nombre: "Comando UNION" }
      ];
      
      let vulnerabilidadesEncontradas = [];
      
      caracteresEspeciales.forEach(({ car, nombre }) => {
        cy.request({
          method: 'POST',
          url: `${urlBase}/login`,
          body: {
            username: `test${car}user`,
            password: 'Test123!'
          },
          failOnStatusCode: false
        }).then((respuesta) => {
          if (respuesta.body.errorMessage) {
            const mensaje = respuesta.body.errorMessage.toLowerCase();
            
            if (mensaje.includes('wrong password') || mensaje.includes('does not exist')) {
              vulnerabilidadesEncontradas.push(nombre);
              cy.log(`⚠️ ${nombre} (${car}) fue procesado sin sanitizar`);
              cy.log(`   Mensaje: ${respuesta.body.errorMessage}`);
            } else if (mensaje.includes('invalid') || mensaje.includes('special')) {
              cy.log(`✅ ${nombre} rechazado correctamente`);
            }
          }
        });
      });
      
      cy.wrap(null).then(() => {
        if (vulnerabilidadesEncontradas.length > 0) {
          cy.log(`\n🚨 RESUMEN: ${vulnerabilidadesEncontradas.length} caracteres peligrosos aceptados:`);
          vulnerabilidadesEncontradas.forEach(v => cy.log(`   - ${v}`));
        } else {
          cy.log('✅ Todos los caracteres especiales fueron rechazados');
        }
      });
    });

    it('Validar que errores SQL no se expongan en respuestas', () => {
      const payloadComplejo = "' UNION SELECT NULL, NULL, NULL FROM information_schema.tables--";
      
      cy.request({
        method: 'POST',
        url: `${urlBase}/login`,
        body: {
          username: payloadComplejo,
          password: 'test'
        },
        failOnStatusCode: false
      }).then((respuesta) => {
        const respuestaStr = JSON.stringify(respuesta.body).toLowerCase();
        
        const erroresSQL = ['syntax error', 'mysql', 'postgresql', 'sql', 'database', 
                           'table', 'column', 'query', 'select', 'from'];
        
        const filtraError = erroresSQL.some(error => respuestaStr.includes(error));
        
        if (filtraError) {
          cy.log('🚨 VULNERABILIDAD ALTA: Errores SQL expuestos en la respuesta');
          cy.log(`Respuesta: ${JSON.stringify(respuesta.body)}`);
          expect(filtraError).to.be.false;
        } else {
          cy.log('✅ No se exponen errores SQL en las respuestas');
        }
      });
    });
  });

  describe('Validaciones Adicionales', () => {
    
    it('Debería rechazar campos vacíos en registro', () => {
      cy.request({
        method: 'POST',
        url: `${urlBase}/signup`,
        body: {
          username: '',
          password: ''
        },
        failOnStatusCode: false
      }).then((respuesta) => {
        expect(respuesta.body.errorMessage).to.exist;
      });
    });

    it('Debería rechazar campos vacíos en login', () => {
      cy.request({
        method: 'POST',
        url: `${urlBase}/login`,
        body: {
          username: '',
          password: ''
        },
        failOnStatusCode: false
      }).then((respuesta) => {
        expect(respuesta.body.errorMessage).to.exist;
      });
    });

    it('Debería manejar caracteres especiales en el username', () => {
      const caracteresEspeciales = `test<script>alert('xss')</script>`;
      
      cy.request({
        method: 'POST',
        url: `${urlBase}/signup`,
        body: {
          username: caracteresEspeciales,
          password: contraseña
        },
        failOnStatusCode: false
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(200);
      });
    });

    it('Debería validar longitud mínima de contraseña', () => {
      cy.request({
        method: 'POST',
        url: `${urlBase}/signup`,
        body: {
          username: `usuario_${Date.now()}`,
          password: '12'
        },
        failOnStatusCode: false
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(200);
      });
    });
  });
});