import fs from 'fs'
import path from 'path'
import { transformFileSync } from 'babel-core'
import plugin from '../lib'

function trim(str) {
  return str.replace(/^\s+|\s+$/, '')
}

const fixturesDir = path.join(__dirname, 'fixtures')

export const transformFixtures = (handler) => {
  fs.readdirSync(fixturesDir)
    //.filter(path => /rx-basic/.test(path))
    .map((caseName) => {
      var lib = caseName.split('-')[0]
      const options = {
        babelrc: false,
        plugins: [
          [plugin, {
            identifiers: '\\$($|\\.)',
            include: '',
            exclude: '**/exclude/**',
            replay: true,
            lib: lib
          }]
        ]
      }
      const fixtureDir = path.join(fixturesDir, caseName)
      const actualPath = path.join(fixtureDir, 'source.js')
      const expectedPath = path.join(fixtureDir, 'transformed.js')
      const actual = trim(transformFileSync(actualPath, options).code)

      const expected = fs.existsSync(expectedPath)
        && trim(fs.readFileSync(expectedPath, 'utf-8'))

      handler && handler({caseName, actual, expected, expectedPath})
    })
}

export default transformFixtures