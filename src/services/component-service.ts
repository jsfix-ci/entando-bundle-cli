import {
  BundleDescriptor,
  MicroFrontend,
  MicroService
} from '../models/bundle-descriptor'
import {
  Component,
  ComponentType,
  MicroFrontendStack,
  MicroServiceStack,
  VersionedComponent
} from '../models/component'
import { BundleDescriptorService } from './bundle-descriptor-service'
import { ComponentDescriptorService } from './component-descriptor-service'
import { CLIError } from '@oclif/errors'
import * as path from 'node:path'
import { MICROFRONTENDS_FOLDER, MICROSERVICES_FOLDER } from '../paths'
import * as fs from 'node:fs'
import {
  ProcessExecutionResult,
  ProcessExecutorService
} from './process-executor-service'
import { debugFactory } from './debug-factory-service'
import { CommandFactoryService, Phase } from './command-factory-service'

export class ComponentService {
  private static debug = debugFactory(ComponentService)

  private readonly bundleDescriptorService: BundleDescriptorService
  private readonly componentDescriptorService: ComponentDescriptorService

  constructor() {
    this.bundleDescriptorService = new BundleDescriptorService(process.cwd())
    this.componentDescriptorService = new ComponentDescriptorService()
  }

  public getComponents(type?: ComponentType): Array<Component<ComponentType>> {
    const { microfrontends, microservices }: BundleDescriptor =
      this.bundleDescriptorService.getBundleDescriptor()

    let components: Array<Component<ComponentType>>

    if (type === ComponentType.MICROFRONTEND) {
      components = microfrontends.map(
        this.mapComponentType(ComponentType.MICROFRONTEND)
      )
    } else if (type === ComponentType.MICROSERVICE) {
      components = microservices.map(
        this.mapComponentType(ComponentType.MICROSERVICE)
      )
    } else {
      components = [
        ...microfrontends.map(
          this.mapComponentType(ComponentType.MICROFRONTEND)
        ),
        ...microservices.map(this.mapComponentType(ComponentType.MICROSERVICE))
      ]
    }

    return components
  }

  public getVersionedComponents(type?: ComponentType): VersionedComponent[] {
    return this.getComponents(type).map(comp => ({
      ...comp,
      version: this.componentDescriptorService.getComponentVersion(comp)
    }))
  }

  public static getComponentPath(component: Component<ComponentType>): string {
    const { name, type } = component
    const componentPath =
      type === ComponentType.MICROSERVICE
        ? path.resolve(MICROSERVICES_FOLDER, name)
        : path.resolve(MICROFRONTENDS_FOLDER, name)
    return componentPath
  }

  public async build(name: string): Promise<ProcessExecutionResult> {
    const component = this.getComponent(name)

    this.validateComponent(component)

    const componentPath = ComponentService.getComponentPath(component)

    if (!fs.existsSync(componentPath)) {
      throw new CLIError(`Directory ${componentPath} not exists`)
    }

    const buildCmd = CommandFactoryService.getCommand(component, Phase.Build)

    ComponentService.debug(`Building ${name} using ${buildCmd}`)

    return ProcessExecutorService.executeProcess({
      command: buildCmd,
      outputStream: process.stdout,
      errorStream: process.stdout,
      workDir: componentPath
    })
  }

  getComponent(name: string): Component<ComponentType> {
    const component = this.getComponents().find(comp => comp.name === name)
    if (component === undefined) {
      throw new CLIError(`Component ${name} not found`)
    }

    return component
  }

  validateComponent(component: Component<ComponentType>): void {
    const { type, stack, name } = component
    if (type === ComponentType.MICROFRONTEND) {
      if (
        !Object.values(MicroFrontendStack).includes(stack as MicroFrontendStack)
      ) {
        throw new CLIError(
          `Component ${name} of type ${type} has an invalid stack ${stack}`
        )
      }
    } else if (type === ComponentType.MICROSERVICE) {
      if (
        !Object.values(MicroServiceStack).includes(stack as MicroServiceStack)
      ) {
        throw new CLIError(
          `Component ${name} of type ${type} has an invalid stack ${stack}`
        )
      }
    } else {
      throw new CLIError(`Invalid component type ${type}`)
    }
  }

  private mapComponentType(
    type: ComponentType
  ): (compToMap: MicroFrontend | MicroService) => Component<ComponentType> {
    return ({ name, stack }) => ({ name, stack, type })
  }
}
