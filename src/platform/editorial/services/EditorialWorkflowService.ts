import type {
  DatasetPublicationStatus,
  DatasetRecordValues,
} from '../../datasets'
import type {
  EditorialAction,
  EditorialAuditEvent,
  EditorialRecordHead,
  EditorialRecordVersion,
} from '../contracts'
import {
  EditorialConcurrencyError,
} from '../contracts'
import type {
  EditorialRepository,
} from '../repositories/EditorialRepository'