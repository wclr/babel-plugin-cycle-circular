import fs from 'fs'
import transform from './transform'
import reedline from 'readline'

const make = (answer) => {
  const doForAll = answer === 'yes'
  transform(({caseName, actual, expected, expectedPath}) => {
    if (expected && expected !== actual){
      console.warn('Expected result is not equal to actual for', caseName)
    }
    if (!expected || doForAll){
      console.log('Save transformed fixture for ', caseName)
      fs.writeFileSync(expectedPath, actual)
    } else {
      console.log('Skipping save transformed fixture for', caseName)
    }
  })
}

if (process.argv[2]){
  make(process.argv[2].replace(/\W/g, ''))
} else {
  const rl = reedline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('Save all even if fixture presents? (no)', make)
}


