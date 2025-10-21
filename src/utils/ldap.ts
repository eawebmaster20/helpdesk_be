/**
 * Utility functions for LDAP Distinguished Name parsing
 */

export interface ParsedUserInfo {
  name: string;
  department: string;
  branch: string;
  company: string;
}

/**
 * Parse LDAP Distinguished Name (DN) to extract user information
 * 
 * @param dn - LDAP Distinguished Name string
 * @returns Parsed user information object
 * 
 * @example
 * ```typescript
 * const dn = "CN=Emmanuel Adomako,OU=IT,OU=Head Office,OU=Star Assurance,DC=sacglobal,DC=local";
 * const result = parseLDAPDN(dn);
 * // Result: {
 * //   name: 'Emmanuel Adomako',
 * //   department: 'IT',
 * //   branch: 'Head Office', 
 * //   company: 'Star Assurance'
 * // }
 * ```
 */
export function parseLDAPDN(dn: string): ParsedUserInfo {
  try {
    // Split the DN by commas and parse each component
    const components = dn.split(',').map(component => component.trim());
    
    let name = '';
    let department = '';
    let branch = '';
    let company = '';
    
    // Track OU order to assign values correctly
    const ous: string[] = [];
    
    components.forEach(component => {
      const [key, value] = component.split('=').map(part => part.trim());
      
      if (key === 'CN') {
        // CN contains the full name
        name = value;
      } else if (key === 'OU') {
        // Collect all OUs in order
        ous.push(value);
      } else if (key === 'DC') {
        // DC components can help identify company if not found in OU
        if (!company && value !== 'local') {
          // Convert domain components to readable company name
          // Add custom mappings here for your organization
          const domainMappings: Record<string, string> = {
            'sacglobal': 'Star Assurance',
            'mycompany': 'My Company Name'
            // Add more mappings as needed
          };
          
          company = domainMappings[value.toLowerCase()] || 
                   value.charAt(0).toUpperCase() + value.slice(1);
        }
      }
    });
    
    // Assign OUs based on typical AD structure:
    // First OU: Department
    // Second OU: Branch/Location
    // Third OU: Company/Organization
    if (ous.length >= 1) department = ous[0];
    if (ous.length >= 2) branch = ous[1];
    if (ous.length >= 3 && !company) company = ous[2];
    
    return {
      name: name || 'Unknown User',
      department: department || 'Unknown Department',
      branch: branch || 'Unknown Branch',
      company: company || 'Unknown Company'
    };
  } catch (error) {
    console.error('Error parsing LDAP DN:', error);
    return {
      name: 'Unknown User',
      department: 'Unknown Department',
      branch: 'Unknown Branch', 
      company: 'Unknown Company'
    };
  }
}

/**
 * Convert user object with DN to payload format
 * 
 * @param user - User object containing DN and other LDAP attributes
 * @returns Formatted payload object
 */
export function createUserPayload(user: any): any {
  if (!user || !user.dn) {
    throw new Error('User object must contain DN property');
  }
  
  const parsedInfo = parseLDAPDN(user.dn);
  
  return {
    name: parsedInfo.name,
    department: parsedInfo.department,
    branch: parsedInfo.branch,
    company: parsedInfo.company,
    // Include other user properties if available
    email: user.mail || user.userPrincipalName || user.email || '',
    username: user.sAMAccountName || user.username || '',
    dn: user.dn
  };
}