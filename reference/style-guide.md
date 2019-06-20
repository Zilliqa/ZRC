# Style Style

# General

- Scilla belongs to a ML family of languages. Our guidelines are similar to the ones followed by OCaml.
- However, there are some differences in areas such as naming conventions. For more details, refer to the preceding sections.
- In the event where you encounter something that is _not_ covered by this document, you can refer to [https://ocaml.org/learn/tutorials/guidelines.htm](https://ocaml.org/learn/tutorials/guidelines.html#How-to-indent-global-let-definitions)l

# Code Layout

### **Indentation**

Use 2 spaces per indentation level.

### **Tabs or Spaces**

Spaces are the preferred indentation method.

### Blank lines

Surround the top of every procedure, library and transition with blank spaces

### Maximum Line Length

As recommended by [PEP 8](<[https://www.python.org/dev/peps/pep-0008/#maximum-line-length](https://www.python.org/dev/peps/pep-0008/#maximum-line-length)>), we recommend that you keep scilla contracts to a maximum of 80 lines for readability.

Wrapped lines should conform to the following rules:

- The first argument should not be attached to the opening parenthesis.
- One, and only one, indent should be used.
- Each argument should fall on its own line.
- The terminating element, );, should be placed on the final line by itself.

```ocaml
(* Good *)
    transition MakeOrder(
    	token_a: ByStr20,
    	value_a: Uint128,
    	token_b: ByStr20,
    	value_b: Uint128,
    	expiration_block: BNum
    )

 (* Bad *)
 (* Reason: All the parameters are in the same line, which makes it hard to read *)
    transition MakeOrder(token_a: ByStr20, value_a: Uint128, token_b: ByStr20, value_b: Uint128, expiration_block: BNum)
```

## Indentation Rules

- Indentation for `let..in` expressions
- The expression following a definition introduced by `let` is indented to the same level as the keyword `let`, and the keyword in which introduces it is written at the end of the line.

```ocaml

    (* Code snippet from Shogi.scilla *)

    (* Good *)
    ...
    let nil_path = Nil {Square} in
    let first_square = move_one_square square north in
    let final_square = move_one_square first_square direction in
    Cons {Square} final_square nil_path

    (* Bad *)
    let nil_path = Nil {Square} in
      let first_square = move_one_square square north in
    		let final_square = move_one_square first_square direction in
          Cons {Square} final_square nil_path
 ```

## Naming Conventions

Definition of the various styles:

- `PascalCase`
- `camelCase`
- `snake_case`
- `lowercase`
- `UPPER_CASE`
- `Camel_snake`

Naming variables with a leading underscore is not allowed (e.g. `_to`)

### Contract and Library Names

- Library and Contracts should be named in PascalCase. E.g. `FungibleToken`, `NonFungibleToken`
- Contract and library name should match filename. 

```ocaml

(* Good *)
(* NonFungibleToken.scilla *)
library NonFungibleToken

contract NonFungibleToken
(
  param1: type,
  ...
)

(* Bad *)
(* nonfungibletoken-finalfinalfinal.scilla *)
library NonFungibleToken

contract NonFungibleToken
(
  param1: type,
  ...
)
```

### Event Names

- Event names should be named in PascalCase. E.g. `TransferFromSuccess`
- Please note that `scilla-checker` checks for the parameters as well. Overloading a event name is not allowed.
- Event name should be concise and contained within a one word.

```ocaml
(* good *)
e = {_eventname: "TransferFromSuccess"; status: "Success" sender: _sender; ...};
e = {_eventname: "TransferFromFailure"; status: "Error";  message: "Unauthorised; ...};

(* bad *)
e = {_eventname: "TransferFrom Not Successful"}
e = {_eventname: "TransferFrom: Success"}
```

### Transition Name

- TransitionName should be named in PascalCase 
- E.g. `TransferFrom`

### Abstract Data Types (ADT)

- ADT names should be in PascalCase.
- Note: The checker currently checks if the error is capitalised, but it does not check for PascalCase

Example:
```ocaml
(* Good *)
type Error =
| GameOver
| PlayingOutOfTurn
| IllegalAction
| InternalError

(* Bad *)
type Error =
| Gameover
| Playingoutofturn
| Illegalsction
| Internalerror

(* Bad (Syntax Error as error types are not capitalised) *)
type Error =
| gameover
| playingoutofturn
| illegalsction
| internalerror


```
### Local Variable Names

- Consistent with OCaml styling guidelines, variable names should be named in snake_case. Variable names with only one word should be in lowercase E.g. `one_msg`,`transfer_amt`, `zero`, `player1`


``` ocaml
(* Good *)
let code_success = Uint32 0

(* Bad *)
let codeSuccess = Uint32 0
let CodeSuccess = Uint32 0
let Code_success = Uint32 0
```

