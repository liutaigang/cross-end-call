import { InjectionToken, container } from 'tsyringe';

export function registerServices(serviceRegistry: InjectionToken<any>[]) {
  serviceRegistry.forEach(container.resolve.bind(container));
}
