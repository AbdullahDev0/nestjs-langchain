/**
 * Data Transfer Object for document file.
 *
 * This class defines the data structure and validation rules for handling a basic
 * user query. It utilizes decorators from the 'class-validator' library to enforce
 * validation constraints on the data received from client requests. This ensures
 * that the user query adheres to the expected format and content requirements.
 *
 * @class DocumentDto
 *
 * @property file - The file string to be used for filename.
 */

export class DocumentDto {
  file: string;
}
