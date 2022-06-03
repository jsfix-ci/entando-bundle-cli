import { expect, test } from '@oclif/test'
import { bundleDescriptor } from '../helpers/mocks/component-service-test/bundle-descriptor'
import {
  BundleDescriptorValidatorService,
  JsonValidationError
} from '../../src/services/bundle-descriptor-validator-service'
import { INVALID_NAME_MESSAGE } from '../../src/models/bundle-descriptor-constraints'

describe('BundleDescriptorValidatorService', () => {
  test.it('No error thrown with valid object', () => {
    BundleDescriptorValidatorService.validateParsedBundleDescriptor(
      bundleDescriptor
    )
  })

  test
    .do(() => {
      const invalidDescriptor: any = getNewBundleDescriptor()
      invalidDescriptor.microservices[0].name = undefined
      BundleDescriptorValidatorService.validateParsedBundleDescriptor(
        invalidDescriptor
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "name" is required')
      expect((error as JsonValidationError).jsonPath).eq(
        '$.microservices[0].name'
      )
    })
    .it('Validates required field')

  test
    .do(() => {
      const invalidDescriptor: any = getNewBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = [
        {
          name: 'invalid-claim',
          type: 'external',
          serviceId: 'service-id'
        }
      ]
      BundleDescriptorValidatorService.validateParsedBundleDescriptor(
        invalidDescriptor
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "type" is not valid. Allowed values are: internal'
      )
      expect((error as JsonValidationError).jsonPath).eq(
        '$.microfrontends[1].apiClaims[0].type'
      )
    })
    .it('Validates union type (ApiClaims)')

  test
    .do(() => {
      const invalidDescriptor: any = getNewBundleDescriptor()
      invalidDescriptor.microfrontends[1].apiClaims = {}
      BundleDescriptorValidatorService.validateParsedBundleDescriptor(
        invalidDescriptor
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "apiClaims" should be an array')
      expect((error as JsonValidationError).jsonPath).eq(
        '$.microfrontends[1].apiClaims'
      )
    })
    .it('Validates object instead of array')

  test
    .do(() => {
      const invalidDescriptor: any = getNewBundleDescriptor()
      invalidDescriptor.microservices = undefined
      BundleDescriptorValidatorService.validateParsedBundleDescriptor(
        invalidDescriptor
      )
    })
    .catch(error => {
      expect(error.message).contain('Field "microservices" is required')
      expect((error as JsonValidationError).jsonPath).eq('$.microservices')
    })
    .it('Validates required array')

  test
    .do(() => {
      const invalidDescriptor: any = getNewBundleDescriptor()
      invalidDescriptor.microfrontends[0].titles = {
        en: {
          not: 'valid'
        }
      }
      BundleDescriptorValidatorService.validateParsedBundleDescriptor(
        invalidDescriptor
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "titles" is not valid. Should be a key-value map of strings'
      )
      expect((error as JsonValidationError).jsonPath).eq(
        '$.microfrontends[0].titles'
      )
    })
    .it('Validates microfrontend titles')

  test
    .do(() => {
      const invalidDescriptor: any = getNewBundleDescriptor()
      invalidDescriptor.description = []
      BundleDescriptorValidatorService.validateParsedBundleDescriptor(
        invalidDescriptor
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "description" is not valid. Should be a string'
      )
      expect((error as JsonValidationError).jsonPath).eq('$.description')
    })
    .it('Validates primitive field wrong type')

  test
    .do(() => {
      const invalidDescriptor: any = getNewBundleDescriptor()
      invalidDescriptor.microfrontends[1].name = 'invalid mfe name'
      BundleDescriptorValidatorService.validateParsedBundleDescriptor(
        invalidDescriptor
      )
    })
    .catch(error => {
      expect(error.message).contain(
        'Field "name" is not valid. ' + INVALID_NAME_MESSAGE
      )
      expect((error as JsonValidationError).jsonPath).eq(
        '$.microfrontends[1].name'
      )
    })
    .it('Validates name using RegExp')
})

function getNewBundleDescriptor(): any {
  // mock descriptor deep clone
  return JSON.parse(JSON.stringify(bundleDescriptor))
}
